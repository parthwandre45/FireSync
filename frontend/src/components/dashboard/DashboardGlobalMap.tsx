import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Tooltip as LeafletTooltip,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Flame,
  Satellite,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Filter,
  Info,
  ExternalLink,
  ChevronRight,
  X,
  Target,
  Search,
  Mountain,
  Map as MapIcon,
  Globe,
  Sliders,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { EnrichedHotspot } from '../../services/fireIntelligenceService';

export type BasemapStyle = 'dark' | 'satellite' | 'terrain' | 'streets';

interface BasemapConfig {
  id: BasemapStyle;
  name: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  baseUrl: string;
  referenceUrl?: string;
  maxZoom: number;
  attribution: string;
}

const BASEMAP_CONFIGS: Record<BasemapStyle, BasemapConfig> = {
  dark: {
    id: 'dark',
    name: 'Dark Intelligence',
    shortLabel: 'DARK',
    description: 'Deep navy oceans and crisp boundaries optimized for fire radiative contrast',
    icon: Globe,
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Imagery',
    shortLabel: 'SATELLITE',
    description: 'High-resolution true-color Earth photography with national boundary vectors',
    icon: Satellite,
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain & Shaded Relief',
    shortLabel: 'TERRAIN',
    description: 'Topographic elevation shading, mountain relief, and continental biomes',
    icon: Mountain,
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; USGS, NOAA, TomTom, Intermap',
  },
  streets: {
    id: 'streets',
    name: 'Geographic Reference',
    shortLabel: 'STREETS',
    description: 'Detailed administrative boundaries, capital cities, highways and landmarks',
    icon: MapIcon,
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap',
  },
};

// NASA GIBS True-Color Corrected Reflectance Tile Layer
const NASA_GIBS_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2024-08-18/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';

// Controller to smoothly pan and zoom map
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [center, zoom, map]);
  return null;
};

// Real-time zoom and bounds listener
const MapStateTracker: React.FC<{
  onZoomChange: (zoom: number) => void;
}> = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  return null;
};

// Map controls overlay
const CustomMapControls: React.FC<{
  onReset: () => void;
  onFlyToCluster?: (lat: number, lon: number) => void;
}> = ({ onReset }) => {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[400] flex flex-col space-y-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-lg bg-space-950/90 hover:bg-space-900 border border-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-lg bg-space-950/90 hover:bg-space-900 border border-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={onReset}
        className="w-8 h-8 rounded-lg bg-space-950/90 hover:bg-space-900 border border-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
        title="Reset Global View"
      >
        <Compass className="w-4 h-4 text-nasa-cyan" />
      </button>
    </div>
  );
};

// Spatial cluster definition
interface HotspotCluster {
  id: string;
  name: string;
  country: string;
  continent: string;
  centerLat: number;
  centerLon: number;
  count: number;
  avgFrp: number;
  maxFrp: number;
  hotspots: EnrichedHotspot[];
}

// Helper to create glowing numeric cluster badge
const createClusterDivIcon = (count: number, color: string, radius: number) => {
  const size = radius * 2;
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${color};
      border: 2px solid #ffffff;
      box-shadow: 0 0 14px ${color}cc, 0 0 24px ${color}66;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: monospace;
      font-size: ${size >= 28 ? '11px' : '10px'};
      font-weight: 800;
      letter-spacing: -0.5px;
      cursor: pointer;
    ">${count}</div>`,
    className: 'firesync-cluster-badge',
    iconSize: [size, size],
    iconAnchor: [radius, radius],
  });
};

interface DashboardGlobalMapProps {
  hotspots: EnrichedHotspot[];
  selectedHotspot: EnrichedHotspot | null;
  onSelectHotspot: (hotspot: EnrichedHotspot | null) => void;
  selectedContinent: string;
  onSelectContinent: (continent: string) => void;
  onClearFilters: () => void;
}

export const DashboardGlobalMap: React.FC<DashboardGlobalMapProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  selectedContinent,
  onSelectContinent,
  onClearFilters,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Basemap style & layer toggles
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>(() => {
    const s = searchParams.get('style');
    if (s === 'satellite' || s === 'terrain' || s === 'streets') return s;
    return 'dark';
  });
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showDetections, setShowDetections] = useState<boolean>(true);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);
  const [showGibsOverlay, setShowGibsOverlay] = useState<boolean>(false);

  // Filters
  const [sensorFilter, setSensorFilter] = useState<'ALL' | 'VIIRS' | 'MODIS'>('ALL');
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI Panels
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState<boolean>(false);

  // Map viewport & zoom tracking
  const [mapCenter, setMapCenter] = useState<[number, number]>([15, 10]);
  const [mapZoom, setMapZoom] = useState<number>(2.2);
  const [currentZoom, setCurrentZoom] = useState<number>(2.2);

  // Handle selected hotspot pan
  useEffect(() => {
    if (selectedHotspot) {
      setMapCenter([selectedHotspot.lat, selectedHotspot.lon]);
      setMapZoom(5.5);
    }
  }, [selectedHotspot]);

  // Handle continent centering
  useEffect(() => {
    if (selectedContinent === 'South America') {
      setMapCenter([-15, -60]);
      setMapZoom(4.5);
    } else if (selectedContinent === 'North America') {
      setMapCenter([42, -105]);
      setMapZoom(4.5);
    } else if (selectedContinent === 'Africa') {
      setMapCenter([-6, 25]);
      setMapZoom(4.5);
    } else if (selectedContinent === 'Asia') {
      setMapCenter([24, 85]);
      setMapZoom(4.5);
    } else if (selectedContinent === 'Oceania') {
      setMapCenter([-22, 134]);
      setMapZoom(4.5);
    } else if (selectedContinent === 'ALL') {
      setMapCenter([15, 10]);
      setMapZoom(2.2);
    }
  }, [selectedContinent]);

  const handleReset = () => {
    onSelectContinent('ALL');
    setSensorFilter('ALL');
    setMinConfidenceFilter(0);
    setSearchQuery('');
    onSelectHotspot(null);
    setMapCenter([15, 10]);
    setMapZoom(2.2);
  };

  // Filtered hotspots for map view
  const visibleHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (selectedContinent !== 'ALL' && h.continent !== selectedContinent) {
        return false;
      }
      if (sensorFilter !== 'ALL' && h.sensorFamily !== sensorFilter) {
        return false;
      }
      if (minConfidenceFilter > 0 && h.confidence < minConfidenceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRegion = h.region.toLowerCase().includes(q);
        const matchesCountry = h.country.toLowerCase().includes(q);
        const matchesContinent = h.continent.toLowerCase().includes(q);
        if (!matchesRegion && !matchesCountry && !matchesContinent) return false;
      }
      return true;
    });
  }, [hotspots, selectedContinent, sensorFilter, minConfidenceFilter, searchQuery]);

  // Dynamic spatial clusters at low zoom levels (currentZoom <= 3.5)
  const clusters = useMemo<HotspotCluster[]>(() => {
    if (!enableClustering || currentZoom > 3.5) {
      return [];
    }

    const clusterMap = new Map<string, EnrichedHotspot[]>();

    visibleHotspots.forEach((h) => {
      // Cluster by geographic sector name and rounded coordinates (~6 deg grid)
      const latGrid = Math.round(h.lat / 7) * 7;
      const lonGrid = Math.round(h.lon / 7) * 7;
      const clusterKey = `${h.country}-${latGrid}-${lonGrid}`;

      if (!clusterMap.has(clusterKey)) {
        clusterMap.set(clusterKey, []);
      }
      clusterMap.get(clusterKey)!.push(h);
    });

    const result: HotspotCluster[] = [];
    clusterMap.forEach((list, key) => {
      const count = list.length;
      const centerLat = list.reduce((sum, h) => sum + h.lat, 0) / count;
      const centerLon = list.reduce((sum, h) => sum + h.lon, 0) / count;
      const avgFrp = Math.round(list.reduce((sum, h) => sum + h.frp, 0) / count);
      const maxFrp = Math.max(...list.map((h) => h.frp));
      const first = list[0];

      result.push({
        id: `cluster-${key}`,
        name: first.sectorName || first.country,
        country: first.country,
        continent: first.continent,
        centerLat: parseFloat(centerLat.toFixed(4)),
        centerLon: parseFloat(centerLon.toFixed(4)),
        count,
        avgFrp,
        maxFrp,
        hotspots: list,
      });
    });

    return result;
  }, [visibleHotspots, enableClustering, currentZoom]);

  // Whether clustering is actively showing badges or exploding to individual points
  const isShowingClusters = enableClustering && currentZoom <= 3.5 && clusters.length > 0;

  // Fly to cluster on click
  const handleClusterClick = (cluster: HotspotCluster) => {
    setMapCenter([cluster.centerLat, cluster.centerLon]);
    setMapZoom(5.5);
  };

  // Marker coloring based on scientific FRP thresholds
  const getMarkerColor = (frp: number) => {
    if (frp >= 380) return '#ef4444'; // Extreme (Crimson)
    if (frp >= 310) return '#f97316'; // Severe (Orange)
    return '#eab308'; // Elevated (Amber)
  };

  const getMarkerRadius = (frp: number) => {
    if (frp >= 400) return 7.5;
    if (frp >= 330) return 6;
    return 4.5;
  };

  const activeConfig = BASEMAP_CONFIGS[basemapStyle];

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-space-950 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'h-[750px] w-full z-40' : 'h-[540px] sm:h-[580px] w-full'
      }`}
    >
      {/* ========================================================================= */}
      {/* TOP MAP CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="bg-space-900/95 border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white">
            <span className="p-1.5 rounded-lg bg-nasa-orange/20 border border-nasa-orange/40 text-nasa-orange">
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">GLOBAL WILDFIRE ACTIVITY MAP</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-space-950/80 border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-nasa-orange animate-pulse" />
            <span className="text-slate-200 font-bold">{visibleHotspots.length}</span>
            <span className="text-slate-400">DETECTIONS</span>
            {isShowingClusters && (
              <span className="text-nasa-cyan font-semibold">({clusters.length} CLUSTERS)</span>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Quick Geographic Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search map location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded-lg bg-space-950 border border-white/15 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-nasa-cyan w-36 sm:w-44"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Continent Filter */}
          <select
            value={selectedContinent}
            onChange={(e) => onSelectContinent(e.target.value)}
            className="bg-space-950 border border-white/15 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-nasa-cyan cursor-pointer"
          >
            <option value="ALL">All Continents</option>
            <option value="South America">South America</option>
            <option value="North America">North America</option>
            <option value="Africa">Africa</option>
            <option value="Asia">Asia</option>
            <option value="Oceania">Oceania</option>
          </select>

          {/* Basemap Style Segmented Selector */}
          <div className="flex bg-space-950 border border-white/15 rounded-lg p-0.5">
            {(['dark', 'satellite', 'terrain', 'streets'] as const).map((styleId) => {
              const cfg = BASEMAP_CONFIGS[styleId];
              const IconComp = cfg.icon;
              return (
                <button
                  key={styleId}
                  onClick={() => setBasemapStyle(styleId)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] transition-all ${
                    basemapStyle === styleId
                      ? 'bg-nasa-blue text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${cfg.name}: ${cfg.description}`}
                >
                  <IconComp className="w-3 h-3" />
                  <span className="hidden md:inline">{cfg.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Layer Visibility Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                isLayersMenuOpen
                  ? 'bg-space-900 border-nasa-cyan text-nasa-cyan'
                  : 'bg-space-950 border-white/15 text-slate-300 hover:text-white'
              }`}
              title="Toggle Map Data Layers"
            >
              <Layers className="w-3.5 h-3.5 text-nasa-cyan" />
              <span className="text-[11px]">LAYERS</span>
            </button>

            {/* Dropdown Menu */}
            {isLayersMenuOpen && (
              <div className="absolute right-0 top-9 w-60 bg-space-950/95 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md z-[500] font-mono text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-white font-bold">
                  <span>MAP DATA LAYERS</span>
                  <button
                    onClick={() => setIsLayersMenuOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
                  <span className="flex items-center space-x-2">
                    <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                    <span>Active Detections</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showDetections}
                    onChange={(e) => setShowDetections(e.target.checked)}
                    className="accent-nasa-cyan rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
                  <span className="flex items-center space-x-2">
                    <Target className="w-3.5 h-3.5 text-nasa-cyan" />
                    <span>Cluster at Low Zoom</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enableClustering}
                    onChange={(e) => setEnableClustering(e.target.checked)}
                    className="accent-nasa-cyan rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
                  <span className="flex items-center space-x-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Labels &amp; Borders</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="accent-nasa-cyan rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300 pt-1 border-t border-white/10">
                  <span className="flex items-center space-x-2">
                    <Satellite className="w-3.5 h-3.5 text-indigo-400" />
                    <span>NASA GIBS Reflectance</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showGibsOverlay}
                    onChange={(e) => setShowGibsOverlay(e.target.checked)}
                    className="accent-nasa-cyan rounded"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-space-950 border border-white/15 text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Map' : 'Expand Map (Theater Mode)'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAP CANVAS CONTAINER */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-[#050a18]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={1.5}
          maxZoom={activeConfig.maxZoom}
          zoomControl={false}
          className="w-full h-full"
          style={{ background: '#050a18' }}
        >
          <MapViewController center={mapCenter} zoom={mapZoom} />
          <MapStateTracker onZoomChange={setCurrentZoom} />
          <CustomMapControls onReset={handleReset} />

          {/* Primary High-Resolution Basemap Layer */}
          <TileLayer
            key={`base-${basemapStyle}`}
            url={activeConfig.baseUrl}
            attribution={activeConfig.attribution}
            maxZoom={activeConfig.maxZoom}
          />

          {/* High-Resolution Geographic Reference Labels & Borders Layer */}
          {showLabels && activeConfig.referenceUrl && (
            <TileLayer
              key={`ref-${basemapStyle}`}
              url={activeConfig.referenceUrl}
              maxZoom={activeConfig.maxZoom}
              opacity={0.92}
            />
          )}

          {/* Optional NASA GIBS Corrected Reflectance TrueColor Layer */}
          {showGibsOverlay && (
            <TileLayer
              key="nasa-gibs-overlay"
              url={NASA_GIBS_URL}
              maxZoom={9}
              opacity={0.7}
              attribution="NASA GIBS / EOSDIS Earthdata"
            />
          )}

          {/* ===================================================================== */}
          {/* RENDER CLUSTERS (at low zoom <= 3.5) */}
          {/* ===================================================================== */}
          {showDetections &&
            isShowingClusters &&
            clusters.map((cluster) => {
              const clusterColor =
                cluster.maxFrp >= 380 ? '#ef4444' : cluster.maxFrp >= 310 ? '#f97316' : '#eab308';
              const radius = Math.min(22, 12 + Math.log2(cluster.count) * 3.5);

              return (
                <React.Fragment key={cluster.id}>
                  {/* Outer Pulsing Reticle Ring */}
                  <CircleMarker
                    center={[cluster.centerLat, cluster.centerLon]}
                    radius={radius + 8}
                    pathOptions={{
                      color: clusterColor,
                      weight: 1.2,
                      dashArray: '3, 4',
                      fill: false,
                      opacity: 0.7,
                    }}
                  />

                  {/* Core Cluster Badge with Centered Numeric Count */}
                  <Marker
                    position={[cluster.centerLat, cluster.centerLon]}
                    icon={createClusterDivIcon(cluster.count, clusterColor, radius)}
                    eventHandlers={{
                      click: () => handleClusterClick(cluster),
                    }}
                  >
                    <LeafletTooltip
                      direction="top"
                      offset={[0, -radius]}
                      opacity={0.95}
                      className="firesync-dark-tooltip"
                    >
                      <div className="font-mono text-xs">
                        <div className="font-bold text-white">{cluster.name}</div>
                        <div className="text-nasa-cyan">{cluster.country} &bull; {cluster.continent}</div>
                        <div className="text-slate-300 mt-1">
                          <span className="font-bold text-nasa-orange">{cluster.count}</span> active detections
                        </div>
                        <div className="text-[10px] text-slate-400">Peak FRP: {cluster.maxFrp} MW</div>
                        <div className="text-[9px] text-emerald-400 mt-0.5">Click to zoom into cluster</div>
                      </div>
                    </LeafletTooltip>
                  </Marker>
                </React.Fragment>
              );
            })}

          {/* ===================================================================== */}
          {/* RENDER INDIVIDUAL FIRE DETECTIONS */}
          {/* ===================================================================== */}
          {showDetections &&
            (!isShowingClusters || !enableClustering) &&
            visibleHotspots.map((point) => {
              const isSelected = selectedHotspot?.id === point.id;
              const markerColor = getMarkerColor(point.frp);
              const radius = getMarkerRadius(point.frp);

              return (
                <React.Fragment key={point.id}>
                  {/* Active Fire Marker */}
                  <CircleMarker
                    center={[point.lat, point.lon]}
                    radius={radius}
                    pathOptions={{
                      color: isSelected ? '#00e5ff' : markerColor,
                      fillColor: markerColor,
                      fillOpacity: isSelected ? 1 : 0.88,
                      weight: isSelected ? 2.5 : 1,
                    }}
                    eventHandlers={{
                      click: () => onSelectHotspot(point),
                    }}
                  >
                    <Popup className="firesync-dark-popup">
                      <div className="p-1 font-mono text-xs">
                        <div className="font-bold text-white mb-1">{point.region}</div>
                        <div className="text-nasa-cyan text-[11px]">{point.country} &bull; {point.continent}</div>
                        <div className="mt-2 text-slate-300">
                          <div>FRP: <span className="text-nasa-orange font-bold">{point.frp} MW</span></div>
                          <div>Sensor: <span className="text-white">{point.specificMission}</span></div>
                          <div>Conf: <span className="text-emerald-400">{point.confidence}%</span></div>
                          <div>Time: <span className="text-slate-400">{point.acquiredUtcString}</span></div>
                        </div>
                        <button
                          onClick={() => navigate(`/hotspots?selected=${point.id}`)}
                          className="mt-2.5 w-full py-1 px-2 rounded bg-nasa-blue text-white text-[10px] text-center font-bold hover:bg-nasa-blue/80 transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>EXPLORE IN HOTSPOT EXPLORER</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>

                  {/* Selected Targeting Halo Ring */}
                  {isSelected && (
                    <CircleMarker
                      center={[point.lat, point.lon]}
                      radius={radius + 12}
                      pathOptions={{
                        color: '#00e5ff',
                        fill: false,
                        dashArray: '4, 4',
                        weight: 1.5,
                        opacity: 0.9,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
        </MapContainer>

        {/* ========================================================================= */}
        {/* FLOATING SELECTED OBSERVATION INSPECTION CARD */}
        {/* ========================================================================= */}
        {selectedHotspot && (
          <div className="absolute top-4 left-4 z-[400] max-w-sm w-full bg-space-950/95 border border-nasa-cyan/40 rounded-xl p-4 shadow-2xl backdrop-blur-md font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2 text-nasa-cyan">
                <Target className="w-4 h-4 animate-pulse" />
                <span className="font-bold tracking-wider">SELECTED FIRE OBSERVATION</span>
              </div>
              <button
                onClick={() => onSelectHotspot(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title="Deselect"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-slate-300">
              <div>
                <div className="text-white font-bold text-sm tracking-tight">{selectedHotspot.region}</div>
                <div className="text-slate-400 text-[11px]">
                  {selectedHotspot.country} &bull; {selectedHotspot.continent}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div className="bg-space-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                  <span className="text-white font-semibold">
                    {selectedHotspot.lat.toFixed(4)}°, {selectedHotspot.lon.toFixed(4)}°
                  </span>
                </div>
                <div className="bg-space-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-500 block text-[10px]">RADIATIVE POWER</span>
                  <span className="text-nasa-orange font-bold text-sm">
                    {selectedHotspot.frp} <span className="text-xs font-normal text-slate-400">MW</span>
                  </span>
                </div>
                <div className="bg-space-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-500 block text-[10px]">BRIGHTNESS TEMP</span>
                  <span className="text-amber-300 font-semibold">
                    {selectedHotspot.brightnessTempK} K ({selectedHotspot.brightnessTempC}°C)
                  </span>
                </div>
                <div className="bg-space-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-500 block text-[10px]">CONFIDENCE</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedHotspot.confidence}% ({selectedHotspot.confidenceCategory})
                  </span>
                </div>
              </div>

              <div className="bg-space-900/60 p-2 rounded-lg border border-white/5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SENSOR PLATFORM</span>
                  <span className="text-white font-semibold">{selectedHotspot.specificMission}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 mt-1">
                  <span>PASS TIMESTAMP</span>
                  <span className="text-nasa-cyan">{selectedHotspot.acquiredUtcString}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => navigate(`/hotspots?selected=${selectedHotspot.id}`)}
                  className="w-full py-2 px-3 rounded-lg bg-nasa-blue hover:bg-nasa-blue/80 text-white font-bold text-[11px] transition-colors flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <span>HOTSPOT MAP</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => navigate(`/hotspots?selected=${selectedHotspot.id}&view=satellite`)}
                  className="w-full py-2 px-3 rounded-lg bg-space-900 hover:bg-space-850 border border-nasa-cyan/40 text-nasa-cyan font-bold text-[11px] transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>SATELLITE VIEW</span>
                  <Satellite className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCIENTIFIC MAP LEGEND */}
        {/* ========================================================================= */}
        <div className="absolute bottom-3 right-3 z-[400]">
          {isLegendOpen ? (
            <div className="bg-space-950/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md font-mono text-[11px] max-w-xs">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
                <span className="font-bold text-white tracking-wider flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-nasa-cyan" />
                  <span>SCIENTIFIC MAP LEGEND</span>
                </span>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                  title="Collapse Legend"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-sm" />
                    <span>Extreme FRP (&gt;= 380 MW)</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">Severe Front</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block shadow-sm" />
                    <span>Severe FRP (310-379 MW)</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">High Intensity</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#eab308] inline-block shadow-sm" />
                    <span>Elevated FRP (&lt; 310 MW)</span>
                  </span>
                  <span className="text-[10px] text-yellow-400">Active Hotspot</span>
                </div>
                {isShowingClusters && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded-full border border-dashed border-white inline-block bg-nasa-orange/40" />
                      <span>Cluster Marker</span>
                    </span>
                    <span className="text-[10px] text-nasa-cyan">Click to expand</span>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-white/10 text-[9.5px] text-slate-400 leading-tight">
                <strong className="text-slate-300">Active Style:</strong> {activeConfig.name} ({activeConfig.maxZoom}x max zoom)
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-space-950/90 border border-white/20 text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 shadow-lg backdrop-blur-md"
            >
              <Info className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>MAP LEGEND</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
