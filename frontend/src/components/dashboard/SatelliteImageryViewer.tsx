import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Satellite,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Flame,
  Info,
  Calendar,
  Clock,
  Compass,
  AlertCircle,
  ExternalLink,
  SplitSquareHorizontal,
  Download,
  ShieldCheck,
  Activity,
  CheckCircle2,
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

interface SatelliteImageryViewerProps {
  hotspot: HotspotPoint;
  onClose?: () => void;
  isModal?: boolean;
}

export const SatelliteImageryViewer: React.FC<SatelliteImageryViewerProps> = ({
  hotspot,
  onClose,
  isModal = false,
}) => {
  const metadata = useMemo(() => getHotspotMetadata(hotspot), [hotspot]);
  const availableConfigs = useMemo(
    () => getAvailableImageryConfigs(metadata.sensor),
    [metadata.sensor]
  );

  const [activeMode, setActiveMode] = useState<ImageryMode>('false_color');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100% for before/after
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [useFallbackSurface, setUseFallbackSurface] = useState<boolean>(false);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(false);
  const [showMetadataInfo, setShowMetadataInfo] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Active configuration for selected mode
  const currentConfig = useMemo(() => {
    return availableConfigs.find((c) => c.mode === activeMode) || availableConfigs[0];
  }, [availableConfigs, activeMode]);

  // Construct authentic NASA GIBS imagery URL
  const primaryImageUrl = useMemo(() => {
    if (useFallbackSurface) {
      return buildHighResSurfaceUrl(hotspot.lat, hotspot.lon, 0.25, 900, 650);
    }
    return buildGibsWmsUrl({
      lat: hotspot.lat,
      lon: hotspot.lon,
      date: metadata.acquiredDate,
      layer: currentConfig.layer,
      delta: 0.35,
      width: 900,
      height: 650,
      format: 'image/jpeg',
    });
  }, [hotspot.lat, hotspot.lon, metadata.acquiredDate, currentConfig.layer, useFallbackSurface]);

  // Baseline pre-fire URL for before/after comparison
  const beforeImageUrl = useMemo(() => {
    return buildGibsWmsUrl({
      lat: hotspot.lat,
      lon: hotspot.lon,
      date: metadata.beforeDate,
      layer: availableConfigs.find((c) => c.mode === 'natural')?.layer || 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
      delta: 0.35,
      width: 900,
      height: 650,
      format: 'image/jpeg',
    });
  }, [hotspot.lat, hotspot.lon, metadata.beforeDate, availableConfigs]);

  // Reset viewport state when hotspot changes
  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
    setUseFallbackSurface(false);
  }, [hotspot.id, activeMode]);

  // Handle pan drag
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
    setZoomLevel((prev) => Math.min(3.5, prev + 0.5));
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

  // Slider drag for before/after comparison
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const groundScaleKm = useMemo(() => calculateGroundScaleKm(hotspot.lat, 0.35), [hotspot.lat]);

  return (
    <div className="flex flex-col h-full bg-space-950 font-mono text-slate-200 select-none">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-space-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-nasa-cyan animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-wider uppercase">
            {metadata.sensor} SATELLITE IMAGERY WORKSTATION
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30">
            {metadata.platform}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowMetadataInfo(!showMetadataInfo)}
            title="Spectral Band Technical Details"
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showMetadataInfo
                ? 'bg-nasa-cyan/20 border-nasa-cyan text-nasa-cyan'
                : 'border-white/10 hover:border-white/20 text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {!isModal && (
            <button
              type="button"
              onClick={() => setIsExpandedModal(true)}
              title="Fullscreen Workstation View"
              className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Satellite Inspector"
              className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white text-xs"
            >
              ESC
            </button>
          )}
        </div>
      </div>

      {/* 2. Spectral Mode Tabs */}
      <div className="flex items-center p-2 bg-space-900/60 border-b border-white/10 gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
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
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-nasa-cyan/20 border border-nasa-cyan text-nasa-cyan font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-space-850/60 border border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15'
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

      {/* 3. Spectral Mode Technical Descriptor Callout */}
      {showMetadataInfo && (
        <div className="p-3 bg-nasa-blue/30 border-b border-nasa-cyan/30 text-xs font-mono space-y-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-nasa-cyan font-bold text-[10px] uppercase">
            <span>Spectral Configuration: {currentConfig.label}</span>
            <span>Bands: {currentConfig.bands}</span>
          </div>
          <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
            {currentConfig.description}
          </p>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span className="text-nasa-cyan">Application:</span> {currentConfig.application}
          </div>
        </div>
      )}

      {/* 4. Satellite Imagery Viewport Canvas */}
      <div
        ref={viewportRef}
        className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[260px] sm:min-h-[320px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading Radar Animation */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-space-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
            <div className="relative w-12 h-12">
              <div className="w-full h-full border-2 border-nasa-cyan/30 border-t-nasa-cyan rounded-full animate-spin" />
              <div className="absolute inset-2 border border-nasa-orange/40 border-b-nasa-orange rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
              <Satellite className="w-4 h-4 text-nasa-cyan absolute inset-0 m-auto" />
            </div>
            <div className="text-center font-mono text-xs">
              <p className="text-nasa-cyan font-bold">ACQUIRING NASA GIBS SATELLITE FEED...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {metadata.acquiredDate} • {metadata.platform} {metadata.sensor}
              </p>
            </div>
          </div>
        )}

        {/* Error / Fallback State */}
        {hasError && (
          <div className="absolute inset-0 z-20 bg-space-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <div className="max-w-xs">
              <h4 className="text-sm font-bold text-white mb-1">NASA GIBS Feed Obscured</h4>
              <p className="text-xs text-slate-400">
                Direct satellite reflectance for {hotspot.region} on {metadata.acquiredDate} was obstructed by cloud cover or beyond swath bounds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUseFallbackSurface(true);
                setHasError(false);
                setIsLoading(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-nasa-cyan/20 border border-nasa-cyan/50 text-nasa-cyan text-xs font-bold hover:bg-nasa-cyan/30 transition-colors"
            >
              SWITCH TO HIGH-RES SURFACE BASEMAP
            </button>
          </div>
        )}

        {/* Standard Single Image Viewport */}
        {activeMode !== 'before_after' ? (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            }}
          >
            <img
              src={primaryImageUrl}
              alt={`${hotspot.region} Satellite Detection`}
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
            className="relative w-full h-full overflow-hidden"
            onMouseMove={(e) => handleSliderMove(e.clientX)}
            onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
          >
            {/* Background: After (Active Fire / Burn Scar) */}
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

            {/* Foreground: Before (Pre-Fire Baseline) Clipped */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforeImageUrl}
                alt="Pre-Fire Baseline Pass"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                style={{ width: viewportRef.current?.clientWidth || '100%', maxWidth: 'none' }}
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                BEFORE: {metadata.beforeDate}
              </div>
            </div>

            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-space-950/80 border border-nasa-orange/40 text-nasa-orange text-[10px] font-bold">
              AFTER: {metadata.acquiredDate}
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-space-950 border-2 border-white flex items-center justify-center text-[10px] text-white shadow-lg">
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* 5. Fire Center Reticle Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative">
            {/* Pulsing Target Rings */}
            <div className="w-10 h-10 -m-5 border border-nasa-orange/80 rounded-full animate-ping opacity-75" />
            <div className="w-6 h-6 -m-3 border-2 border-nasa-orange rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(255,109,0,0.8)]">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Crosshair Lines */}
            <div className="absolute w-8 h-px bg-nasa-orange/60 -left-10 top-0" />
            <div className="absolute w-8 h-px bg-nasa-orange/60 left-2 top-0" />
            <div className="absolute h-8 w-px bg-nasa-orange/60 -top-10 left-0" />
            <div className="absolute h-8 w-px bg-nasa-orange/60 top-2 left-0" />

            {/* Target Label HUD */}
            <div className="absolute top-4 left-4 px-2 py-1 rounded bg-space-950/85 border border-nasa-orange/40 backdrop-blur-md text-[10px] font-mono whitespace-nowrap shadow-lg">
              <span className="text-nasa-orange font-bold">HOTSPOT: {hotspot.frp} MW</span>
              <span className="text-slate-400 block text-[9px]">
                {hotspot.lat.toFixed(4)}°, {hotspot.lon.toFixed(4)}°
              </span>
            </div>
          </div>
        </div>

        {/* 6. On-Screen Viewport Floating Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-1 bg-space-950/85 border border-white/10 rounded-lg p-1 backdrop-blur-md text-xs">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1.0}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom (1:1)"
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[10px] text-nasa-cyan font-bold">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        {/* 7. Ground Scale Bar Indicator */}
        <div className="absolute bottom-3 left-3 z-10 p-1.5 rounded-lg bg-space-950/85 border border-white/10 backdrop-blur-md font-mono text-[9px] text-slate-300 space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="w-12 h-1 bg-white inline-block border-l border-r border-nasa-cyan" />
            <span className="text-nasa-cyan font-bold">~{Math.round(groundScaleKm / zoomLevel)} KM</span>
          </div>
          <div className="text-[8px] text-slate-400">
            {currentConfig.resolution} • NASA GIBS WMS
          </div>
        </div>
      </div>

      {/* 8. Scientific Metadata & Telemetry Inspector Grid */}
      <div className="p-3 border-t border-white/10 bg-space-900/80 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 block text-[9px] uppercase">SENSOR & PLATFORM</span>
            <span className="font-bold text-white truncate block">{metadata.sensor} ({metadata.platform})</span>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 block text-[9px] uppercase">ACQUISITION PASS</span>
            <span className="font-bold text-nasa-cyan block">{metadata.acquiredTime}</span>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 block text-[9px] uppercase">FIRE RADIATIVE PWR</span>
            <span className="font-bold text-nasa-orange block">{hotspot.frp} MW</span>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 block text-[9px] uppercase">BRIGHTNESS TEMP</span>
            <span className="font-bold text-amber-300 block">{metadata.brightnessTemp} K</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NASA FIRMS Level-2 Verified Anomaly ({hotspot.confidence}% Confidence)</span>
          </div>
          <a
            href={`https://worldview.earthdata.nasa.gov/?v=${hotspot.lon - 1},${hotspot.lat - 1},${hotspot.lon + 1},${hotspot.lat + 1}&t=${metadata.acquiredDate}-T00%3A00%3A00Z`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-nasa-cyan hover:underline"
          >
            <span>OPEN IN NASA WORLDVIEW</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* 9. Fullscreen Modal Dialog */}
      {isExpandedModal && (
        <div className="fixed inset-0 z-[9999] bg-space-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-nasa-cyan" />
              <h3 className="text-sm font-bold text-white">
                NASA HIGH-RESOLUTION ORBITAL INSPECTOR — {hotspot.region}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpandedModal(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-white/20">
            <SatelliteImageryViewer
              hotspot={hotspot}
              isModal={true}
              onClose={() => setIsExpandedModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

