import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Satellite,
  Flame,
  Layers,
  Activity,
  SplitSquareHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Compass,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  Info,
  ArrowLeft,
  Target,
  Radio,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { HotspotPoint, getHotspotMetadata } from '../earth/fireData';
import {
  ImageryMode,
  SatelliteImageryConfig,
  buildGibsWmsUrl,
  buildHighResSurfaceUrl,
  getAvailableImageryConfigs,
  calculateGroundScaleKm,
} from '../../services/satelliteImageryService';

interface DedicatedSatelliteWorkspaceProps {
  selectedHotspot: HotspotPoint | null;
  hotspotsList: HotspotPoint[];
  onSelectHotspot: (point: HotspotPoint) => void;
  onBackToMap: () => void;
}

export const DedicatedSatelliteWorkspace: React.FC<DedicatedSatelliteWorkspaceProps> = ({
  selectedHotspot,
  hotspotsList,
  onSelectHotspot,
  onBackToMap,
}) => {
  // Current hotspot index within the list for previous/next navigation
  const currentIndex = useMemo(() => {
    if (!selectedHotspot) return -1;
    return hotspotsList.findIndex((p) => p.id === selectedHotspot.id);
  }, [selectedHotspot, hotspotsList]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectHotspot(hotspotsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < hotspotsList.length - 1) {
      onSelectHotspot(hotspotsList[currentIndex + 1]);
    }
  };

  // Telemetry metadata
  const metadata = useMemo(() => {
    return selectedHotspot ? getHotspotMetadata(selectedHotspot) : null;
  }, [selectedHotspot]);

  // Available spectral configs based on sensor
  const availableConfigs = useMemo(() => {
    if (!metadata) return [];
    return getAvailableImageryConfigs(metadata.sensor);
  }, [metadata]);

  const [activeMode, setActiveMode] = useState<ImageryMode>('false_color');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sliderPosition, setSliderPosition] = useState<number>(50); // % for before/after comparison
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [useFallbackSurface, setUseFallbackSurface] = useState<boolean>(false);
  const [showMetadataInfo, setShowMetadataInfo] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Active configuration
  const currentConfig = useMemo(() => {
    return availableConfigs.find((c) => c.mode === activeMode) || availableConfigs[0];
  }, [availableConfigs, activeMode]);

  // Reset viewport state when target or spectral mode changes
  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
    setUseFallbackSurface(false);
  }, [selectedHotspot?.id, activeMode]);

  // Construct primary NASA GIBS WMS imagery URL
  const primaryImageUrl = useMemo(() => {
    if (!selectedHotspot || !metadata || !currentConfig) return '';
    if (useFallbackSurface) {
      return buildHighResSurfaceUrl(selectedHotspot.lat, selectedHotspot.lon, 0.35, 1400, 950);
    }
    return buildGibsWmsUrl({
      lat: selectedHotspot.lat,
      lon: selectedHotspot.lon,
      date: metadata.acquiredDate,
      layer: currentConfig.layer,
      delta: 0.35,
      width: 1400,
      height: 950,
      format: 'image/jpeg',
    });
  }, [selectedHotspot, metadata, currentConfig, useFallbackSurface]);

  // Pre-fire baseline URL for before/after comparison
  const beforeImageUrl = useMemo(() => {
    if (!selectedHotspot || !metadata || !availableConfigs.length) return '';
    const naturalLayer = availableConfigs.find((c) => c.mode === 'natural')?.layer || 'VIIRS_SNPP_CorrectedReflectance_TrueColor';
    return buildGibsWmsUrl({
      lat: selectedHotspot.lat,
      lon: selectedHotspot.lon,
      date: metadata.beforeDate,
      layer: naturalLayer,
      delta: 0.35,
      width: 1400,
      height: 950,
      format: 'image/jpeg',
    });
  }, [selectedHotspot, metadata, availableConfigs]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4.0, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1.0, prev - 0.5);
      if (next === 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Split-slider drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  // Ground scale calculation
  const groundScaleKm = useMemo(() => {
    if (!selectedHotspot) return 50;
    return calculateGroundScaleKm(selectedHotspot.lat, 0.35);
  }, [selectedHotspot]);

  // Native fullscreen toggle
  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Listen to fullscreen exit event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFullscreen]);

  // ==========================================
  // EMPTY STATE: No Hotspot Target Designated
  // ==========================================
  if (!selectedHotspot || !metadata) {
    return (
      <div className="flex-1 flex flex-col bg-space-950 font-mono text-slate-200">
        {/* Sub-bar with back button */}
        <div className="px-6 py-3 border-b border-white/10 bg-space-900/90 flex items-center justify-between">
          <button
            onClick={onBackToMap}
            className="flex items-center space-x-2 text-xs font-mono text-nasa-cyan hover:text-white px-3 py-1.5 rounded-lg bg-nasa-blue/20 border border-nasa-cyan/30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO FIRE MAP</span>
          </button>
          <span className="text-xs text-slate-400">STANDBY MODE // AWAITING TARGET DESIGNATION</span>
        </div>

        {/* Empty State Banner & Quick Targets */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-nasa-blue/20 border border-nasa-cyan/30 flex items-center justify-center text-nasa-cyan shadow-glow-cyan/20">
            <Satellite className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              NO WILDFIRE TARGET DESIGNATED FOR ORBITAL IMAGERY
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto font-sans leading-relaxed">
              Select an active thermal anomaly from the curated constellation hotlist below or return to the interactive Fire Map to pick a geographic sector.
            </p>
          </div>

          {/* Quick Curated Target Cards */}
          <div className="w-full pt-4">
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
              <span className="flex items-center space-x-2 text-nasa-orange">
                <Radio className="w-3.5 h-3.5" />
                <span>SELECT FROM HIGH-INTENSITY FRONTS</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {hotspotsList.length} TARGETS AVAILABLE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotspotsList.slice(0, 6).map((point) => (
                <div
                  key={point.id}
                  onClick={() => onSelectHotspot(point)}
                  className="p-3.5 rounded-xl bg-space-900/80 border border-white/10 hover:border-nasa-cyan/60 hover:bg-space-850 cursor-pointer transition-all text-left space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-nasa-cyan font-bold truncate max-w-[150px]">
                      {point.satellite}
                    </span>
                    <span className="text-nasa-orange font-bold">{point.frp} MW</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-nasa-cyan transition-colors truncate">
                    {point.region}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
                    <span>{point.lat.toFixed(3)}°, {point.lon.toFixed(3)}°</span>
                    <span className="text-emerald-400 text-[10px] font-mono font-bold">
                      {point.confidence}% CONF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onBackToMap}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-nasa-blue text-white font-mono text-xs font-bold hover:bg-blue-600 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>RETURN TO INTERACTIVE FIRE MAP</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE WORKSPACE: Large Immersive Canvas
  // ==========================================
  return (
    <div
      ref={canvasContainerRef}
      className={`flex-1 flex flex-col bg-space-950 font-mono text-slate-200 select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-[9999]' : 'h-full min-h-0'
      }`}
    >
      {/* 1. Top Sub-Bar: Navigation, Target Identity, & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-space-900/95 border-b border-white/10 backdrop-blur-md z-20">
        {/* Left: Back to Map & Target Cycling */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBackToMap}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Return to Leaflet Fire Map"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-nasa-cyan" />
            <span className="hidden sm:inline">BACK TO MAP</span>
            <span className="sm:hidden">MAP</span>
          </button>

          {/* Hotspot Prev / Next Cycling */}
          <div className="flex items-center space-x-1 bg-space-850 border border-white/10 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
              title="Previous Hotspot (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] text-slate-400 font-mono">
              {currentIndex + 1} / {hotspotsList.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= hotspotsList.length - 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
              title="Next Hotspot (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Active Target Badge */}
        <div className="flex items-center space-x-2.5 max-w-md">
          <div className="w-2 h-2 rounded-full bg-nasa-orange animate-pulse" />
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white truncate">{selectedHotspot.region}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-nasa-orange/20 text-nasa-orange border border-nasa-orange/30 font-bold">
                {selectedHotspot.frp} MW
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-2">
              <span>{selectedHotspot.lat.toFixed(4)}°, {selectedHotspot.lon.toFixed(4)}°</span>
              <span>•</span>
              <span className="text-nasa-cyan font-semibold">{metadata.sensor} ({metadata.platform})</span>
              <span>•</span>
              <span>{metadata.acquiredTime}</span>
            </div>
          </div>
        </div>

        {/* Right: Spectral Mode Selectors & Viewport Controls */}
        <div className="flex items-center space-x-2">
          {/* Spectral Mode Pills */}
          <div className="hidden md:flex items-center space-x-1 bg-space-850 p-1 rounded-xl border border-white/10 text-xs">
            {availableConfigs.map((cfg) => {
              const isActive = activeMode === cfg.mode;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(cfg.mode);
                    setUseFallbackSurface(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap text-[11px] ${
                    isActive
                      ? 'bg-nasa-cyan text-space-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cfg.mode === 'false_color' && <Flame className="w-3 h-3 text-nasa-orange" />}
                  {cfg.mode === 'natural' && <Layers className="w-3 h-3 text-emerald-400" />}
                  {cfg.mode === 'thermal' && <Activity className="w-3 h-3 text-red-400" />}
                  {cfg.mode === 'before_after' && <SplitSquareHorizontal className="w-3 h-3 text-purple-400" />}
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Viewport Zoom & Fullscreen Controls */}
          <div className="flex items-center space-x-1 bg-space-850 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Reset Zoom (1:1)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowMetadataInfo(!showMetadataInfo)}
              className={`p-1.5 rounded-lg transition-colors ${
                showMetadataInfo ? 'bg-nasa-cyan/20 text-nasa-cyan' : 'hover:bg-white/10 text-slate-300'
              }`}
              title="Toggle Technical Spectral Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Spectral Mode Tabs (Visible on small screens) */}
      <div className="flex md:hidden items-center p-2 bg-space-900 border-b border-white/10 gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {availableConfigs.map((cfg) => {
          const isActive = activeMode === cfg.mode;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => {
                setActiveMode(cfg.mode);
                setUseFallbackSurface(false);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-nasa-cyan text-space-950 font-bold'
                  : 'bg-space-850 text-slate-400'
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Optional Spectral Info Callout Bar */}
      {showMetadataInfo && (
        <div className="px-4 py-2.5 bg-nasa-blue/20 border-b border-nasa-cyan/20 text-xs flex flex-wrap items-center justify-between gap-2 z-10 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <span className="text-nasa-cyan font-bold">{currentConfig.label}:</span>
            <span className="text-slate-300 font-sans">{currentConfig.description}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            <span className="text-nasa-cyan">BANDS:</span> {currentConfig.bands} | <span className="text-nasa-cyan">WAVELENGTH:</span> {currentConfig.wavelength}
          </div>
        </div>
      )}

      {/* 2. Main Workspace Body: Large Immersive Canvas (Center) + Compact Sidebar (Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* DOMINANT SATELLITE CANVAS VIEWPORT */}
        {/* ======================================================== */}
        <div
          className="flex-1 bg-black relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Subtle Grid Reticle Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, #00e5ff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Loading Radar Sweep */}
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-space-950/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
              <div className="relative w-14 h-14">
                <div className="w-full h-full border-2 border-nasa-cyan/20 border-t-nasa-cyan rounded-full animate-spin" />
                <div
                  className="absolute inset-2 border-2 border-nasa-orange/30 border-b-nasa-orange rounded-full animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                />
                <Satellite className="w-5 h-5 text-nasa-cyan absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-nasa-cyan tracking-wider">
                  STREAMING NASA GIBS SATELLITE REFLECTANCE...
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {metadata.acquiredDate} • {metadata.platform} {metadata.sensor} ({currentConfig.resolution})
                </p>
              </div>
            </div>
          )}

          {/* Obscured Imagery Fallback */}
          {hasError && (
            <div className="absolute inset-0 z-20 bg-space-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-bold text-white">Direct Orbital Reflectance Obscured</h4>
                <p className="text-xs text-slate-400 font-sans">
                  The direct optical reflectance for {selectedHotspot.region} on {metadata.acquiredDate} was obstructed by cloud cover or fell outside the daylight pass boundary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseFallbackSurface(true);
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="px-4 py-2 rounded-lg bg-nasa-cyan/20 border border-nasa-cyan/50 text-nasa-cyan text-xs font-bold hover:bg-nasa-cyan/30 transition-colors"
              >
                SWITCH TO HIGH-RES SURFACE BASEMAP
              </button>
            </div>
          )}

          {/* Primary Satellite Image Viewport */}
          {activeMode !== 'before_after' ? (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              }}
            >
              <img
                src={primaryImageUrl}
                alt={`${selectedHotspot.region} Satellite Detection`}
                className="w-full h-full object-cover select-none pointer-events-none"
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : (
            /* Before / After Split Slider Mode */
            <div
              ref={sliderRef}
              className="relative w-full h-full overflow-hidden select-none"
              onMouseMove={(e) => handleSliderMove(e.clientX)}
              onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
            >
              {/* Active Fire Burn Layer */}
              <img
                src={primaryImageUrl}
                alt="Active Fire Pass"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />

              {/* Pre-Fire Baseline Layer (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={beforeImageUrl}
                  alt="Pre-Fire Baseline Pass"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/75 border border-white/20 text-[10px] text-white backdrop-blur-md">
                  PRE-FIRE BASELINE ({metadata.beforeDate})
                </div>
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-nasa-cyan shadow-glow-cyan/50 cursor-ew-resize z-10"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-space-950 border-2 border-nasa-cyan flex items-center justify-center shadow-lg">
                  <SplitSquareHorizontal className="w-3.5 h-3.5 text-nasa-cyan" />
                </div>
              </div>

              <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-black/75 border border-nasa-orange/40 text-[10px] text-nasa-orange backdrop-blur-md">
                ACTIVE FIRE ({metadata.acquiredDate})
              </div>
            </div>
          )}

          {/* Center Target Reticle Crosshair */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative">
              {/* Outer Target Box */}
              <div className="w-16 h-16 border border-nasa-cyan/40 rounded-full flex items-center justify-center animate-pulse" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-nasa-cyan" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-nasa-cyan" />
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 h-0.5 w-2 bg-nasa-cyan" />
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 h-0.5 w-2 bg-nasa-cyan" />
              {/* Inner Flame Point */}
              <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-nasa-orange shadow-[0_0_8px_#ff5722]" />
            </div>
          </div>

          {/* Lower Left: Ground Scale & Coordinate Bar */}
          <div className="absolute bottom-4 left-4 z-10 p-2.5 rounded-xl bg-space-950/85 border border-white/15 backdrop-blur-md text-[10px] space-y-1">
            <div className="flex items-center space-x-2">
              <Compass className="w-3 h-3 text-nasa-cyan" />
              <span className="text-white font-semibold">
                {selectedHotspot.lat.toFixed(4)}°N, {selectedHotspot.lon.toFixed(4)}°E
              </span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <div className="w-16 h-1 bg-nasa-cyan rounded-full" />
              <span className="text-slate-400">~{groundScaleKm} km field</span>
              <span className="text-slate-500">•</span>
              <span className="text-nasa-cyan">{zoomLevel.toFixed(1)}x MAG</span>
            </div>
          </div>

          {/* Lower Right: Sensor Telemetry Stamp */}
          <div className="absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-space-950/85 border border-white/15 backdrop-blur-md text-[10px] space-y-1 text-right">
            <div className="text-white font-semibold flex items-center justify-end space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>NASA FIRMS Level-2 Verified</span>
            </div>
            <div className="text-slate-400">
              {metadata.platform} // {metadata.sensor} ({metadata.scanResolution})
            </div>
            <div className="text-nasa-orange font-bold">
              Radiative Power: {selectedHotspot.frp} MW
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COMPACT MISSION-CONTROL SIDEBAR (TELEMETRY & HOTLIST) */}
        {/* ======================================================== */}
        <div className="w-80 lg:w-92 bg-space-900/95 border-l border-white/10 flex flex-col justify-between overflow-y-auto backdrop-blur-md p-4 space-y-4">
          <div className="space-y-4">
            {/* Sidebar Title */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2 text-nasa-cyan text-xs">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-bold tracking-wider">TARGET TELEMETRY</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                LOCKED
              </span>
            </div>

            {/* Target Highlight Box */}
            <div className="p-3.5 rounded-xl bg-space-850/80 border border-nasa-orange/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-[10px] text-nasa-cyan">TARGET SECTOR</span>
                <span className="font-bold text-white">{selectedHotspot.satellite}</span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {selectedHotspot.region}
              </h3>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-2xl font-black text-nasa-orange">
                    {selectedHotspot.frp} <span className="text-xs font-normal text-slate-300">MW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Combustion: {(selectedHotspot.frp * 0.082).toFixed(1)} kg/s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-amber-300">
                    {metadata.brightnessTemp} <span className="text-xs font-normal text-slate-300">K</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {selectedHotspot.confidence}% CONF
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 text-[11px]">ACQUISITION PASS</span>
                <span className="text-white font-semibold text-[11px]">{metadata.acquiredTime}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 text-[11px]">PLATFORM & SENSOR</span>
                <span className="text-nasa-cyan font-semibold text-[11px] truncate max-w-[160px]">
                  {metadata.platform} {metadata.sensor}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 text-[11px]">SCAN RESOLUTION</span>
                <span className="text-white font-semibold text-[11px]">{metadata.scanResolution}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 text-[11px]">ACTIVE BANDS</span>
                <span className="text-nasa-cyan font-semibold text-[11px] truncate max-w-[160px]">
                  {currentConfig.bands}
                </span>
              </div>
            </div>

            {/* Scientific Spectral Application Note */}
            <div className="p-3 rounded-xl bg-space-850/50 border border-white/5 text-[11px] space-y-1 font-sans">
              <div className="text-nasa-cyan font-mono font-bold text-[10px] uppercase">
                {currentConfig.label} Application
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentConfig.application}
              </p>
            </div>

            {/* Constellation Hotlist (Quick Switcher) */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span>CONSTELLATION HOTLIST</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {hotspotsList.length} TARGETS
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {hotspotsList.slice(0, 12).map((p) => {
                  const isCurrent = selectedHotspot.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectHotspot(p)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-nasa-blue/40 border-nasa-cyan shadow-sm shadow-nasa-cyan/20'
                          : 'bg-space-850/60 border-white/5 hover:border-white/20 hover:bg-space-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-white truncate text-[11px]">
                          {p.region}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {p.satellite} • {p.confidence}%
                        </div>
                      </div>
                      <div className="text-nasa-orange font-bold text-[11px] shrink-0">
                        {p.frp} MW
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* External Verification Link */}
          <div className="pt-3 border-t border-white/10">
            <a
              href={`https://worldview.earthdata.nasa.gov/?v=${selectedHotspot.lon - 1},${selectedHotspot.lat - 1},${selectedHotspot.lon + 1},${selectedHotspot.lat + 1}&t=${metadata.acquiredDate}-T00%3A00%3A00Z`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-nasa-blue/20 hover:bg-nasa-blue/40 border border-nasa-cyan/30 text-nasa-cyan hover:text-white text-xs font-mono transition-colors"
            >
              <span>VERIFY IN NASA WORLDVIEW</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

