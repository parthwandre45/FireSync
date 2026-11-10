import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Flame,
  Satellite,
  Search,
  Maximize2,
  Compass,
  AlertCircle,
  X,
  Target,
  ChevronRight,
  Eye,
  Sliders,
  Layers,
  ShieldCheck,
  Radio,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react';
import { GLOBAL_HOTSPOTS, HotspotPoint } from '../../components/earth/fireData';
import { SatelliteImageryViewer } from '../../components/dashboard/SatelliteImageryViewer';
import { DedicatedSatelliteWorkspace } from '../../components/dashboard/DedicatedSatelliteWorkspace';

// Map controller to smoothly fly to selected hotspot coordinates
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);
  return null;
};

export interface HotspotExplorerProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const HotspotExplorer: React.FC<HotspotExplorerProps> = ({
  isEmbedded = false,
  onClose,
}) => {
  // View mode switcher: 'map' (Leaflet map) or 'satellite' (dedicated satellite workspace)
  const [activeView, setActiveView] = useState<'map' | 'satellite'>('map');

  const [selectedSatellite, setSelectedSatellite] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [minFrp, setMinFrp] = useState<number>(100);
  const [searchRegion, setSearchRegion] = useState<string>('');
  
  // Initialize with the highest intensity hotspot active for immediate orbital inspection
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotPoint | null>(() => {
    return GLOBAL_HOTSPOTS[0] || null;
  });
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    return GLOBAL_HOTSPOTS[0] ? [GLOBAL_HOTSPOTS[0].lat, GLOBAL_HOTSPOTS[0].lon] : [20, 0];
  });
  const [mapZoom, setMapZoom] = useState<number>(4.5);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  // Listen to incoming URL parameters for deep-linking from Dashboard or Observation table
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId) {
      const baseId = selectedId.split('-c')[0];
      const match = GLOBAL_HOTSPOTS.find((h) => h.id === selectedId || h.id === baseId);
      if (match) {
        setSelectedHotspot(match);
        setMapCenter([match.lat, match.lon]);
        setMapZoom(6);
        setIsSidebarOpen(true);
      }
    }
    const regionParam = searchParams.get('region');
    if (regionParam) {
      setSearchRegion(regionParam);
      const match = GLOBAL_HOTSPOTS.find((h) =>
        h.region.toLowerCase().includes(regionParam.toLowerCase())
      );
      if (match) {
        setSelectedHotspot(match);
        setMapCenter([match.lat, match.lon]);
        setMapZoom(5);
        setIsSidebarOpen(true);
      }
    }
    const viewParam = searchParams.get('view');
    if (viewParam === 'satellite') {
      setActiveView('satellite');
    }
  }, [searchParams]);

  // Filter hotspots based on user controls
  const filteredHotspots = useMemo(() => {
    return GLOBAL_HOTSPOTS.filter((point) => {
      if (selectedSatellite !== 'ALL' && !point.satellite.includes(selectedSatellite)) {
        return false;
      }
      if (point.confidence < minConfidence) {
        return false;
      }
      if (point.frp < minFrp) {
        return false;
      }
      if (
        searchRegion &&
        !point.region.toLowerCase().includes(searchRegion.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [selectedSatellite, minConfidence, minFrp, searchRegion]);

  const handleSelectHotspot = (point: HotspotPoint) => {
    setSelectedHotspot(point);
    setIsSidebarOpen(true);
    setMapCenter([point.lat, point.lon]);
    setMapZoom(5.5);
  };

  const handleClearSelection = () => {
    setSelectedHotspot(null);
    setIsSidebarOpen(false);
  };

  return (
    <div
      className={`w-full flex flex-col font-sans ${
        isEmbedded
          ? 'h-full min-h-0 bg-space-950/95 border border-nasa-cyan/35 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md'
          : 'h-screen pt-16 bg-space-950 text-slate-100 overflow-hidden'
      }`}
    >
      {/* Top Map & Workspace Control Bar */}
      <div className="bg-space-900/90 border-b border-white/10 px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-nasa-orange/20 border border-nasa-orange/30 text-nasa-orange shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2 leading-tight">
              <span>Interactive Hotspot Explorer</span>
              <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                {filteredHotspots.length} DETECTIONS
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              NASA FIRMS global active thermal anomalies and multi-spectral satellite observations
            </p>
          </div>
        </div>

        {/* Center: Dedicated View Mode Switcher (Fire Map vs Satellite View) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-0.5 rounded-lg bg-space-850 border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveView('map')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-nasa-blue text-white font-bold shadow-sm border border-nasa-cyan/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>FIRE MAP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('satellite')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all cursor-pointer ${
                activeView === 'satellite'
                  ? 'bg-nasa-cyan text-space-950 font-bold shadow-glow-cyan/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>SATELLITE VIEW</span>
              {selectedHotspot && (
                <span className="w-1.5 h-1.5 rounded-full bg-nasa-orange animate-pulse" />
              )}
            </button>
          </div>

          {/* Embedded Swap Button back to 3D Planet */}
          {isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-nasa-cyan/15 hover:bg-nasa-cyan/30 border border-nasa-cyan/40 text-nasa-cyan text-xs font-mono font-bold transition-all cursor-pointer"
              title="Swap back to 3D Earth Globe"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SWAP TO 3D GLOBE</span>
              <span className="sm:hidden">GLOBE</span>
            </button>
          )}
        </div>

        {/* Quick Filter Inputs */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {/* Satellite selector */}
          <div className="flex items-center space-x-1.5 bg-space-850 border border-white/10 rounded-lg px-2 py-1">
            <Satellite className="w-3 h-3 text-nasa-cyan" />
            <select
              value={selectedSatellite}
              onChange={(e) => setSelectedSatellite(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-space-900">ALL SATELLITES</option>
              <option value="VIIRS" className="bg-space-900">VIIRS</option>
              <option value="MODIS" className="bg-space-900">MODIS</option>
            </select>
          </div>

          {/* Min FRP Threshold */}
          <div className="hidden md:flex items-center space-x-1.5 bg-space-850 border border-white/10 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 text-[11px]">FRP:</span>
            <input
              type="range"
              min="50"
              max="400"
              step="25"
              value={minFrp}
              onChange={(e) => setMinFrp(Number(e.target.value))}
              className="w-16 accent-nasa-orange cursor-pointer"
            />
            <span className="text-amber-300 font-bold text-[11px] w-12">{minFrp} MW</span>
          </div>

          {/* Search region */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search region..."
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              className="bg-space-850 border border-white/10 rounded-lg pl-7 pr-2.5 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-nasa-cyan/40 w-28 sm:w-36 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main View Area: Either Dedicated Satellite Workspace OR Interactive Fire Map */}
      {activeView === 'satellite' ? (
        /* ======================================================== */
        /* VIEW 1: DEDICATED SATELLITE OBSERVATION WORKSPACE        */
        /* ======================================================== */
        <DedicatedSatelliteWorkspace
          selectedHotspot={selectedHotspot}
          hotspotsList={filteredHotspots}
          onSelectHotspot={(point) => {
            setSelectedHotspot(point);
            setMapCenter([point.lat, point.lon]);
          }}
          onBackToMap={() => setActiveView('map')}
        />
      ) : (
        /* ======================================================== */
        /* VIEW 2: INTERACTIVE LEAFLET FIRE MAP & DRAWER            */
        /* ======================================================== */
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
          {/* Leaflet Map Container */}
          <div className="flex-1 w-full h-full relative min-h-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              minZoom={2}
              maxZoom={12}
              className="w-full h-full"
              zoomControl={true}
            >
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* NASA Dark Matter Cartographic Basemap */}
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />

              {/* Render Hotspot Glowing CircleMarkers with Concentric Reticle Selection Rings */}
              {filteredHotspots.map((point) => {
                const isSelected = selectedHotspot?.id === point.id;
                const color = point.frp > 280 ? '#ff1744' : point.frp > 180 ? '#ff6d00' : '#ffab00';
                const radius = 3 + (point.frp / 400) * 5;

                return (
                  <React.Fragment key={point.id}>
                    {/* Concentric targeting reticle rings for the active hotspot */}
                    {isSelected && (
                      <>
                        <CircleMarker
                          center={[point.lat, point.lon]}
                          radius={radius + 8}
                          pathOptions={{
                            color: '#00e5ff',
                            fillColor: '#00e5ff',
                            fillOpacity: 0.15,
                            weight: 1.5,
                            dashArray: '3, 4',
                          }}
                        />
                        <CircleMarker
                          center={[point.lat, point.lon]}
                          radius={radius + 18}
                          pathOptions={{
                            color: '#ff5722',
                            fillColor: 'transparent',
                            fillOpacity: 0,
                            weight: 1,
                            dashArray: '2, 6',
                          }}
                        />
                      </>
                    )}

                    {/* Core Thermal Anomaly Marker */}
                    <CircleMarker
                      center={[point.lat, point.lon]}
                      radius={isSelected ? radius + 2.5 : radius}
                      pathOptions={{
                        color: isSelected ? '#ffffff' : color,
                        fillColor: isSelected ? '#ff2a00' : color,
                        fillOpacity: isSelected ? 1 : 0.85,
                        weight: isSelected ? 2.5 : 1.5,
                      }}
                      eventHandlers={{
                        click: () => handleSelectHotspot(point),
                      }}
                    >
                      <Popup className="dark-popup">
                        <div className="bg-space-950 text-slate-100 p-2.5 rounded-lg font-mono text-xs border border-white/20 min-w-[220px]">
                          <div className="flex items-center justify-between text-[10px] text-nasa-cyan mb-1 font-semibold">
                            <span>{point.satellite}</span>
                            <span>{point.confidence}% CONF</span>
                          </div>
                          <div className="font-bold text-sm text-white mb-1">{point.region}</div>
                          <div className="text-nasa-orange font-bold text-xs mb-1">
                            FRP: {point.frp} MW
                          </div>
                          <div className="text-slate-400 text-[10px] space-y-0.5">
                            <div>LAT: {point.lat.toFixed(4)}° / LON: {point.lon.toFixed(4)}°</div>
                            <div className="text-nasa-cyan text-[9px] pt-1 font-bold">
                              Click marker to inspect telemetry & satellite imagery
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>

            {/* Floating Map Legend */}
            <div className="absolute bottom-6 left-6 z-[1000] p-3 rounded-xl bg-space-950/90 border border-white/15 backdrop-blur-md font-mono text-xs shadow-2xl space-y-2 pointer-events-auto">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>FIRE RADIATIVE POWER</span>
                <span className="text-[9px] text-nasa-cyan">NASA FIRMS</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff1744] shadow-sm animate-pulse" />
                  <span className="text-slate-300">&gt; 280 MW (Extreme front)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff6d00] shadow-sm" />
                  <span className="text-slate-300">180 - 280 MW (Severe)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffab00] shadow-sm" />
                  <span className="text-slate-300">100 - 180 MW (Moderate)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotspot Inspector Drawer (Right Panel) */}
          <div
            className={`w-full ${
              isEmbedded
                ? 'sm:w-80 lg:w-96 absolute right-0 top-0 bottom-0 z-20 shadow-2xl'
                : 'lg:w-[480px] xl:w-[540px] 2xl:w-[580px] z-10'
            } bg-space-900/95 border-l border-white/10 flex flex-col justify-between overflow-y-auto backdrop-blur-md font-mono transition-all duration-300 ${
              isEmbedded
                ? isSidebarOpen && selectedHotspot
                  ? 'translate-x-0'
                  : 'translate-x-full pointer-events-none'
                : isSidebarOpen
                ? 'translate-x-0'
                : 'translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="p-4 sm:p-5 space-y-4">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-nasa-cyan text-xs">
                  <Compass className="w-4 h-4" />
                  <span className="font-bold tracking-wider">HOTSPOT INSPECTION</span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedHotspot && (
                    <button
                      onClick={handleClearSelection}
                      className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      title="Deselect hotspot and view full map"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>DESELECT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* If a hotspot is selected: Show Target Details, Satellite View CTA, & Viewer */}
              {selectedHotspot ? (
                <div className="space-y-4">
                  {/* Target Sector Header Card */}
                  <div className="p-3.5 rounded-xl bg-space-850/90 border border-nasa-orange/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-nasa-orange/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center space-x-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span className="text-[10px] font-bold">TARGET LOCKED</span>
                      </span>
                      <span className="text-nasa-cyan font-semibold">{selectedHotspot.satellite}</span>
                    </div>
                    
                    <div className="flex items-baseline justify-between mt-1">
                      <h3 className="text-lg font-bold text-white truncate max-w-[280px]">
                        {selectedHotspot.region}
                      </h3>
                      <div className="text-xl font-black text-nasa-orange">
                        {selectedHotspot.frp} <span className="text-xs font-normal text-slate-300">MW</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>COORDS: {selectedHotspot.lat.toFixed(4)}°, {selectedHotspot.lon.toFixed(4)}°</span>
                      <span className="text-amber-300 font-semibold">{selectedHotspot.confidence}% CONF</span>
                    </div>
                  </div>

                  {/* PROMINENT CTA: Open in Dedicated Satellite Workspace */}
                  <button
                    type="button"
                    onClick={() => setActiveView('satellite')}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-nasa-blue/40 via-space-850 to-space-850 border border-nasa-cyan/40 hover:border-nasa-cyan text-left transition-all group shadow-md cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-nasa-cyan/20 border border-nasa-cyan/30 text-nasa-cyan group-hover:scale-105 transition-transform">
                        <Satellite className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-nasa-cyan transition-colors flex items-center space-x-1.5">
                          <span>OPEN DEDICATED SATELLITE VIEW</span>
                          <ArrowRight className="w-3.5 h-3.5 text-nasa-cyan group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Switch to full-screen NASA multi-spectral observation workspace
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-nasa-cyan bg-nasa-cyan/10 px-2 py-1 rounded border border-nasa-cyan/20 hidden sm:inline-block">
                      WORKSPACE
                    </span>
                  </button>

                  {/* NASA Multi-Spectral Satellite Imagery Viewer (In-Panel View) */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
                      <span className="flex items-center space-x-1.5">
                        <Satellite className="w-3.5 h-3.5 text-nasa-cyan" />
                        <span>SATELLITE IMAGERY PREVIEW</span>
                      </span>
                      <span className="text-[10px] text-nasa-cyan font-normal">
                        NASA GIBS WMS (EPSG:4326)
                      </span>
                    </div>

                    <SatelliteImageryViewer
                      hotspot={selectedHotspot}
                      onClose={handleClearSelection}
                    />
                  </div>
                </div>
              ) : (
                /* Empty State: Guidance Prompt */
                <div className="text-center py-12 px-4 rounded-xl bg-space-850/40 border border-white/5 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-nasa-blue/20 border border-nasa-cyan/30 mx-auto flex items-center justify-center text-nasa-cyan">
                    <Target className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      NO HOTSPOT TARGET SELECTED
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                      Click any thermal anomaly point on the global map or select from the high-priority constellation targets below to stream NASA multi-spectral satellite imagery.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-nasa-cyan bg-nasa-blue/20 border border-nasa-cyan/20 p-2 rounded-lg max-w-xs mx-auto">
                    Available imagery: True Color (RGB), SWIR False Color, and Thermal Anomaly Masks.
                  </div>
                </div>
              )}

              {/* Constellation Hotlist / Rapid Target Switcher */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3">
                  <span className="flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-nasa-orange" />
                    <span>CONSTELLATION HOTLIST</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {filteredHotspots.length} AVAILABLE
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredHotspots.slice(0, 10).map((p) => {
                    const isCur = selectedHotspot?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectHotspot(p)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isCur
                            ? 'bg-nasa-blue/30 border-nasa-cyan shadow-sm shadow-nasa-cyan/20'
                            : 'bg-space-850/60 border-white/5 hover:border-white/20 hover:bg-space-800/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            {isCur && <span className="w-1.5 h-1.5 rounded-full bg-nasa-cyan" />}
                            <span className="font-semibold text-white truncate max-w-[180px]">
                              {p.region}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>{p.satellite}</span>
                            <span>•</span>
                            <span>{p.confidence}% CONF</span>
                            <span>•</span>
                            <span className="text-emerald-400">
                              {p.acquiredDate || '2023-08-16'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-nasa-orange font-bold text-xs">{p.frp} MW</div>
                          <div className="text-[9px] text-slate-500 font-sans">
                            {(p.frp * 0.082).toFixed(1)} kg/s
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
