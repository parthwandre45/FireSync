import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Flame,
  Satellite,
  Maximize2,
  Minimize2,
  Compass,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  ArrowRightLeft,
} from 'lucide-react';
import { GLOBAL_HOTSPOTS, HotspotPoint } from '../earth/fireData';

// Helper component to smoothly pan map when a hotspot is selected
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Custom zoom control buttons
const MapControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute top-2 right-2 z-[400] flex flex-col space-y-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          map.zoomIn();
        }}
        className="w-6 h-6 rounded bg-space-950/90 border border-nasa-cyan/40 hover:bg-nasa-cyan/20 text-nasa-cyan flex items-center justify-center transition-colors cursor-pointer"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          map.zoomOut();
        }}
        className="w-6 h-6 rounded bg-space-950/90 border border-nasa-cyan/40 hover:bg-nasa-cyan/20 text-nasa-cyan flex items-center justify-center transition-colors cursor-pointer"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface TacticalLeafletMapProps {
  selectedHotspot?: HotspotPoint | null;
  onSelectHotspot?: (point: HotspotPoint) => void;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const TacticalLeafletMap: React.FC<TacticalLeafletMapProps> = ({
  selectedHotspot,
  onSelectHotspot,
  className = '',
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const [filterSatellite, setFilterSatellite] = useState<'ALL' | 'VIIRS' | 'MODIS'>('ALL');
  const [mapCenter, setMapCenter] = useState<[number, number]>([12, 20]);
  const [mapZoom, setMapZoom] = useState<number>(1.8);
  const [internalExpanded, setInternalExpanded] = useState<boolean>(false);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  // Filter hotspots based on satellite selection
  const visibleHotspots = useMemo(() => {
    return GLOBAL_HOTSPOTS.filter((h) => {
      if (filterSatellite === 'ALL') return true;
      return h.satellite.includes(filterSatellite);
    });
  }, [filterSatellite]);

  // Synchronize when external selectedHotspot changes
  React.useEffect(() => {
    if (selectedHotspot) {
      setMapCenter([selectedHotspot.lat, selectedHotspot.lon]);
      setMapZoom(4);
    }
  }, [selectedHotspot]);

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-nasa-cyan/30 bg-space-950/90 backdrop-blur-md shadow-2xl transition-all duration-300 ${
        isExpanded ? 'h-[460px] sm:h-[480px] w-full' : 'h-[220px] sm:h-[240px]'
      } ${className}`}
    >
      {/* Map Header HUD Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-space-900/90 border-b border-white/10 text-xs font-mono select-none z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-nasa-orange animate-ping" />
          <span className="text-[11px] font-bold text-white tracking-wider flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>{isExpanded ? 'CENTER TACTICAL COMMAND MAP' : 'TACTICAL FIRMS RADAR MAP'}</span>
          </span>
          <span className="text-[10px] text-nasa-cyan bg-nasa-blue/30 px-1.5 py-0.5 rounded border border-nasa-cyan/30">
            {visibleHotspots.length} ACTIVE
          </span>
        </div>

        {/* Satellite Filter Tabs & Expand/Swap Button */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setFilterSatellite('ALL')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              filterSatellite === 'ALL'
                ? 'bg-nasa-cyan text-space-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilterSatellite('VIIRS')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              filterSatellite === 'VIIRS'
                ? 'bg-nasa-orange text-space-950 font-bold'
                : 'text-slate-400 hover:text-nasa-orange'
            }`}
          >
            VIIRS
          </button>
          <button
            onClick={() => setFilterSatellite('MODIS')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              filterSatellite === 'MODIS'
                ? 'bg-sky-400 text-space-950 font-bold'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            MODIS
          </button>

          <button
            onClick={handleToggle}
            className="flex items-center space-x-1 px-2 py-0.5 ml-1 rounded bg-nasa-cyan/15 hover:bg-nasa-cyan/30 border border-nasa-cyan/40 text-nasa-cyan text-[10px] font-bold transition-all cursor-pointer"
            title={isExpanded ? 'Swap back with 3D Earth' : 'Expand & Swap with 3D Earth'}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span className="hidden sm:inline">{isExpanded ? 'SWAP TO GLOBE' : 'EXPAND / SWAP'}</span>
          </button>
        </div>
      </div>

      {/* Real Interactive Leaflet Map Container */}
      <div className="relative flex-1 w-full h-full min-h-[160px] bg-[#02040a]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={1.5}
          maxZoom={9}
          scrollWheelZoom={false} // Crucial: prevents wheel hijacking page scroll
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <MapViewController center={mapCenter} zoom={mapZoom} />
          <MapControls />

          {/* NASA Dark Matter Cartographic Tiles */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            maxZoom={16}
          />

          {/* Hotspot Markers */}
          {visibleHotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            const markerColor =
              spot.frp > 300 ? '#ff1744' : spot.frp > 260 ? '#ff6d00' : '#ffab00';
            const radius = isSelected ? 7 : Math.max(3.5, (spot.frp / 400) * 6);

            return (
              <CircleMarker
                key={spot.id}
                center={[spot.lat, spot.lon]}
                radius={radius}
                pathOptions={{
                  color: isSelected ? '#ffffff' : markerColor,
                  fillColor: markerColor,
                  fillOpacity: isSelected ? 1.0 : 0.85,
                  weight: isSelected ? 2.5 : 1.2,
                }}
                eventHandlers={{
                  click: () => {
                    onSelectHotspot?.(spot);
                  },
                }}
              >
                <Popup className="dark-fire-popup" closeButton={false}>
                  <div className="p-2 bg-space-950 text-white rounded font-mono text-[11px] leading-tight space-y-1 min-w-[170px] border border-nasa-orange/40">
                    <div className="flex items-center justify-between text-nasa-orange font-bold border-b border-white/10 pb-1">
                      <span className="flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-nasa-orange" />
                        <span>ACTIVE THERMAL ANOMALY</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{spot.confidence}%</span>
                    </div>
                    <div className="text-white font-semibold pt-0.5">{spot.region}</div>
                    <div className="text-[10px] text-slate-300">
                      COORDS: {spot.lat.toFixed(2)}°, {spot.lon.toFixed(2)}°
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                      <span className="text-nasa-cyan">{spot.satellite}</span>
                      <span className="text-amber-400 font-bold">{spot.frp} MW</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Bottom coordinate telemetry overlay */}
        <div className="absolute bottom-1.5 left-2 z-[400] flex items-center space-x-2 text-[9px] font-mono text-slate-400 bg-space-950/80 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
          <Crosshair className="w-3 h-3 text-nasa-cyan" />
          <span>TILES: CARTO DARK // CRS: EPSG:3857 // NASA EOS PROTOCOL</span>
        </div>
      </div>
    </div>
  );
};

