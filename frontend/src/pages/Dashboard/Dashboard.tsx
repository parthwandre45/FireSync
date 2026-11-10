import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  Satellite,
  Activity,
  AlertTriangle,
  Globe2,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Compass,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TimeRangeFilter,
  EnrichedHotspot,
  getEnrichedHotspots,
  getGlobalMetrics,
  getRegionalIntelligence,
  getSatelliteMissionStatuses,
  getDiurnalTimeline,
  getConfidenceDistribution,
  convertApiObservationToEnriched,
} from '../../services/fireIntelligenceService';
import { apiClient } from '../../services/apiClient';
import { DashboardGlobalMap } from '../../components/dashboard/DashboardGlobalMap';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Time range selector: 24h, 48h, 7d, 30d
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUtcTime, setCurrentUtcTime] = useState('');

  // Filtering and selection states
  const [selectedContinent, setSelectedContinent] = useState<string>('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState<EnrichedHotspot | null>(null);
  const [liveHotspots, setLiveHotspots] = useState<EnrichedHotspot[] | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Table search, filter and pagination states
  const [tableSearch, setTableSearch] = useState('');
  const [tableSensorFilter, setTableSensorFilter] = useState<'ALL' | 'VIIRS' | 'MODIS'>('ALL');
  const [tableConfidenceFilter, setTableConfidenceFilter] = useState<number>(0);
  const [tableSortField, setTableSortField] = useState<'time' | 'frp' | 'confidence' | 'location'>('time');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Active tooltip state for metrics
  const [activeMetricTooltip, setActiveMetricTooltip] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Load from backend REST API with fallback to deterministic cache
  useEffect(() => {
    let isMounted = true;
    apiClient
      .getFires({ limit: 1000 })
      .then((fires) => {
        if (isMounted && fires && fires.length > 0) {
          const enriched = fires.map((f) => convertApiObservationToEnriched(f));
          setLiveHotspots(enriched);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsLiveConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtcTime(
        `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hotspots dataset based on selected time range (using live backend if available)
  const allHotspots = useMemo(() => {
    if (liveHotspots && liveHotspots.length > 0) {
      return liveHotspots;
    }
    return getEnrichedHotspots(timeRange);
  }, [liveHotspots, timeRange]);

  // Listen to incoming search params for deep linking
  useEffect(() => {
    const cont = searchParams.get('continent');
    if (cont) setSelectedContinent(cont);

    const sel = searchParams.get('selected');
    if (sel) {
      const match = allHotspots.find((h) => h.id === sel || h.id.startsWith(sel));
      if (match) setSelectedHotspot(match);
    }
  }, [searchParams, allHotspots]);

  // Global KPIs based on dataset
  const globalMetrics = useMemo(() => {
    return getGlobalMetrics(allHotspots, timeRange);
  }, [allHotspots, timeRange]);

  // Regional metrics
  const regionalData = useMemo(() => {
    return getRegionalIntelligence(allHotspots);
  }, [allHotspots]);

  // Satellite missions telemetry
  const satelliteStatuses = useMemo(() => {
    return getSatelliteMissionStatuses(allHotspots);
  }, [allHotspots]);

  // Diurnal hourly curve
  const diurnalData = useMemo(() => {
    return getDiurnalTimeline(allHotspots);
  }, [allHotspots]);

  // Confidence distribution
  const confidenceData = useMemo(() => {
    return getConfidenceDistribution(allHotspots);
  }, [allHotspots]);

  // Regional comparison bar chart data
  const regionalChartData = useMemo(() => {
    const continentMap = new Map<string, { count: number; totalFrp: number }>();
    allHotspots.forEach((h) => {
      const existing = continentMap.get(h.continent) || { count: 0, totalFrp: 0 };
      continentMap.set(h.continent, {
        count: existing.count + 1,
        totalFrp: existing.totalFrp + h.frp,
      });
    });

    return Array.from(continentMap.entries())
      .map(([continent, val]) => ({
        continent,
        detections: val.count,
        avgFrp: Math.round(val.totalFrp / val.count),
      }))
      .sort((a, b) => b.detections - a.detections);
  }, [allHotspots]);

  // Sensor Comparison data across 5 missions
  const sensorChartData = useMemo(() => {
    return satelliteStatuses.map((sat) => ({
      name: sat.name.replace(' (JPSS-1)', '').replace(' (EOS PM-1)', '').replace(' (EOS AM-1)', '').replace(' (JPSS-2)', ''),
      detections: sat.detectionCount,
      sensor: sat.sensor,
      latency: sat.dataLatency,
    }));
  }, [satelliteStatuses]);

  // Live backend sync refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fires = await apiClient.getFires({ limit: 1000 });
      if (fires && fires.length > 0) {
        const enriched = fires.map((f) => convertApiObservationToEnriched(f));
        setLiveHotspots(enriched);
        setIsLiveConnected(true);
      }
    } catch {
      // fallback remains active
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSelectedContinent('ALL');
    setSelectedHotspot(null);
  };

  // Filtered & Sorted Table Observations
  const filteredTableObservations = useMemo(() => {
    let result = allHotspots.filter((h) => {
      if (selectedContinent !== 'ALL' && h.continent !== selectedContinent) {
        return false;
      }
      if (tableSensorFilter !== 'ALL' && h.sensorFamily !== tableSensorFilter) {
        return false;
      }
      if (tableConfidenceFilter > 0 && h.confidence < tableConfidenceFilter) {
        return false;
      }
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const matchesRegion = h.region.toLowerCase().includes(query);
        const matchesCountry = h.country.toLowerCase().includes(query);
        const matchesSensor = h.specificMission.toLowerCase().includes(query);
        if (!matchesRegion && !matchesCountry && !matchesSensor) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (tableSortField === 'time') {
        return tableSortDirection === 'asc' ? b.hoursAgo - a.hoursAgo : a.hoursAgo - b.hoursAgo;
      }
      if (tableSortField === 'frp') {
        return tableSortDirection === 'asc' ? a.frp - b.frp : b.frp - a.frp;
      }
      if (tableSortField === 'confidence') {
        return tableSortDirection === 'asc' ? a.confidence - b.confidence : b.confidence - a.confidence;
      }
      if (tableSortField === 'location') {
        return tableSortDirection === 'asc'
          ? a.country.localeCompare(b.country)
          : b.country.localeCompare(a.country);
      }
      return 0;
    });

    return result;
  }, [
    allHotspots,
    selectedContinent,
    tableSensorFilter,
    tableConfidenceFilter,
    tableSearch,
    tableSortField,
    tableSortDirection,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTableObservations.length / itemsPerPage));
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTableObservations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTableObservations, currentPage]);

  const handleSort = (field: 'time' | 'frp' | 'confidence' | 'location') => {
    if (tableSortField === field) {
      setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 font-sans">
      {/* ========================================================================= */}
      {/* SECTION A: DASHBOARD HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-2">
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-nasa-blue/20 border border-nasa-cyan/40 text-nasa-cyan">
              <Globe2 className="w-3.5 h-3.5" />
              <span>NASA FIRMS TELEMETRY // LEVEL-2 NRT</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isLiveConnected ? 'POSTGRES API ONLINE' : 'FEED NOMINAL'}</span>
            </span>
            <span className="text-slate-400 flex items-center space-x-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentUtcTime || '2026-11-10 03:00:00 UTC'}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            GLOBAL FIRE INTELLIGENCE
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Near real-time multi-spectral wildfire thermal anomaly synthesis from NASA Terra, Aqua, Suomi-NPP, and NOAA-20/21 constellations.
          </p>
        </div>

        {/* Header Controls: Time Range & Sync */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range selector */}
          <div className="flex bg-space-900 border border-white/10 rounded-xl p-1 text-xs font-mono shadow-inner">
            {(
              [
                { id: '24h', label: '24H' },
                { id: '48h', label: '48H' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
              ] as const
            ).map((range) => (
              <button
                key={range.id}
                onClick={() => {
                  setTimeRange(range.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === range.id
                    ? 'bg-nasa-blue text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Sync Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3.5 py-2 bg-space-900 hover:bg-space-850 border border-white/10 hover:border-nasa-cyan/40 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Synchronize Satellite Telemetry Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-nasa-cyan ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'SYNCING...' : 'SYNC FEED'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: GLOBAL FIRE STATISTICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 font-mono">
        {/* Metric 1: Active Fire Detections */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">ACTIVE DETECTIONS</span>
              <button
                onClick={() => setActiveMetricTooltip(activeMetricTooltip === 'm1' ? null : 'm1')}
                className="text-slate-500 hover:text-nasa-cyan"
                title="Observation details"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-3xl font-black text-white">{globalMetrics.activeDetections.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans">
              375m & 1km thermal anomaly pixels
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-rose-400 mt-3 font-sans pt-2 border-t border-white/5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {globalMetrics.trendPercentage >= 0 ? `+${globalMetrics.trendPercentage}%` : `${globalMetrics.trendPercentage}%`} vs previous cycle
            </span>
          </div>
          {activeMetricTooltip === 'm1' && (
            <div className="absolute inset-0 bg-space-950/95 p-3 text-[11px] font-sans text-slate-300 z-10 flex flex-col justify-between border border-nasa-cyan/40 rounded-2xl">
              <div>
                <strong className="text-white block font-mono text-xs mb-1">Detections vs Incidents:</strong>
                Satellite instruments record thermal pixels (375m for VIIRS, 1km for MODIS). Multiple detections represent different sectors of an active fire front.
              </div>
              <button
                onClick={() => setActiveMetricTooltip(null)}
                className="text-xs text-nasa-cyan self-end mt-2 underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Metric 2: New Detections */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">NEW DETECTIONS</span>
              <Flame className="w-4 h-4 text-nasa-orange" />
            </div>
            <div className="text-3xl font-black text-nasa-orange">{globalMetrics.newDetections}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans">
              First observed in last 6h orbit
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 font-sans pt-2 border-t border-white/5">
            Active burn rate acceleration
          </div>
        </div>

        {/* Metric 3: High-Confidence Detections */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">HIGH CONFIDENCE</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {globalMetrics.highConfidenceDetections}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans">
              {globalMetrics.highConfidencePct}% meeting &ge; 80% criteria
            </div>
          </div>
          <div className="text-xs text-emerald-400/90 mt-3 font-sans pt-2 border-t border-white/5">
            Verified ground thermal signals
          </div>
        </div>

        {/* Metric 4: Affected Countries */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">AFFECTED COUNTRIES</span>
              <Globe2 className="w-4 h-4 text-nasa-cyan" />
            </div>
            <div className="text-3xl font-black text-nasa-cyan">
              {globalMetrics.affectedCountriesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans">
              Across {globalMetrics.affectedContinentsCount} continental sectors
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 font-sans pt-2 border-t border-white/5">
            Global geographic footprint
          </div>
        </div>

        {/* Metric 5: Peak Radiative Power */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">PEAK RADIATIVE POWER</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300">
              {globalMetrics.peakFrp} <span className="text-xs font-normal text-slate-400">MW</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans truncate">
              {globalMetrics.peakFrpHotspot ? globalMetrics.peakFrpHotspot.country : 'Amazon Basin'}
            </div>
          </div>
          <div className="text-xs text-amber-400/90 mt-3 font-sans pt-2 border-t border-white/5">
            Avg FRP: {globalMetrics.avgFrp} MW
          </div>
        </div>

        {/* Metric 6: Latest Observation */}
        <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">LATEST OBSERVATION</span>
              <Satellite className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white truncate">
              {globalMetrics.latestObservation ? `${globalMetrics.latestObservation.hoursAgo}h ago` : '32m ago'}
            </div>
            <div className="text-[11px] text-indigo-300 mt-1 truncate">
              {globalMetrics.latestObservation ? globalMetrics.latestObservation.specificMission : 'VIIRS (NOAA-20)'}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-mono pt-2 border-t border-white/5 truncate">
            {globalMetrics.latestObservation ? globalMetrics.latestObservation.region.split('(')[0] : 'Amazon Alta Floresta'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: GLOBAL WILDFIRE ACTIVITY MAP (CENTERPIECE) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Interactive Earth Observation Telemetry</span>
              <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 rounded bg-white/5">
                LEAFLET GEOSPATIAL CENTERPIECE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any thermal anomaly point to inspect sensor radiometry, coordinates, FRP and open in Hotspot Explorer.
            </p>
          </div>

          {selectedContinent !== 'ALL' && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-mono text-nasa-cyan hover:underline flex items-center space-x-1 self-start sm:self-auto"
            >
              <span>RESET CONTINENT FILTER ({selectedContinent})</span>
            </button>
          )}
        </div>

        {/* The Large Visual Centerpiece Map */}
        <DashboardGlobalMap
          hotspots={allHotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={setSelectedHotspot}
          selectedContinent={selectedContinent}
          onSelectContinent={setSelectedContinent}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: FIRE ACTIVITY ANALYTICS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Fire Activity Analytics &amp; Sensor Telemetry</span>
            <span className="text-xs font-mono font-normal text-nasa-cyan px-2 py-0.5 rounded bg-nasa-blue/20 border border-nasa-cyan/30">
              5 ANALYTIC STREAMS
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diurnal curve, regional volume, sensor resolution yield, confidence distribution, and historical cycle deltas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Diurnal Fire Detection Timeline */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Diurnal Fire Activity Timeline</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                    UTC DIURNAL CYCLE
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison of VIIRS (375m) and MODIS (1km) observation frequency across the solar day
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <span className="flex items-center space-x-1.5 text-nasa-orange">
                  <span className="w-2.5 h-2.5 rounded-full bg-nasa-orange inline-block" />
                  <span>VIIRS (375m)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-nasa-cyan">
                  <span className="w-2.5 h-2.5 rounded-full bg-nasa-cyan inline-block" />
                  <span>MODIS (1km)</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diurnalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viirsGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5722" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ff5722" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="modisGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050a18',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="viirs"
                    name="VIIRS Observations"
                    stroke="#ff5722"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viirsGrad2)"
                  />
                  <Area
                    type="monotone"
                    dataKey="modis"
                    name="MODIS Observations"
                    stroke="#00e5ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#modisGrad2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Confidence Distribution Donut */}
          <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Observation Confidence</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Radiometer detection certainty classification
              </p>
            </div>

            <div className="h-44 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#050a18" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050a18',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-white/10">
              {confidenceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 text-[11px]">{item.category}</span>
                  </div>
                  <span className="font-bold text-white text-[11px]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Regional Comparison BarChart & Sensor Breakdown BarChart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 2: Regional Continental Comparison */}
          <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Continental Fire Observation Comparison</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any continent to filter the global activity map
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">SORTED BY COUNT</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionalChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis type="category" dataKey="continent" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050a18',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="detections"
                    name="Active Detections"
                    fill="#00e5ff"
                    radius={[0, 4, 4, 0]}
                    onClick={(entry) => setSelectedContinent(entry.continent)}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Sensor Comparison Across Supported Missions */}
          <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Sensor Observation Yield</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detections captured by satellite instrument platform
                </p>
              </div>
              <span className="text-xs font-mono text-nasa-cyan">5 MISSIONS</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensorChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050a18',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="detections" name="Observations" fill="#ff5722" radius={[4, 4, 0, 0]}>
                    {sensorChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sensor === 'VIIRS' ? '#ff5722' : '#38bdf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: REGIONAL FIRE INTELLIGENCE */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Regional Fire Intelligence &amp; Country Rankings</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                {regionalData.length} NATIONS CLASSIFIED
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by thermal observation count, fire radiative power, and 24h trajectory. Select any country to target on map.
            </p>
          </div>

          <Link
            to="/hotspots"
            className="text-xs font-mono text-nasa-cyan hover:text-white flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <span>VIEW IN HOTSPOT EXPLORER</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 font-medium">COUNTRY / TERRITORY</th>
                <th className="pb-3 font-medium">CONTINENT</th>
                <th className="pb-3 font-medium">DETECTIONS</th>
                <th className="pb-3 font-medium">AVG FRP</th>
                <th className="pb-3 font-medium">PEAK FRP</th>
                <th className="pb-3 font-medium">RISK LEVEL</th>
                <th className="pb-3 font-medium">PRIMARY SENSOR</th>
                <th className="pb-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {regionalData.map((reg) => {
                const isSelected = selectedContinent === reg.continent;
                return (
                  <tr
                    key={reg.name}
                    className={`hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-nasa-blue/10 border-l-2 border-nasa-cyan' : ''
                    }`}
                  >
                    <td className="py-3 font-medium text-white flex items-center space-x-2">
                      <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                      <span className="font-bold">{reg.country}</span>
                    </td>
                    <td className="py-3 text-slate-300">{reg.continent}</td>
                    <td className="py-3 text-white font-bold">{reg.count}</td>
                    <td className="py-3 text-amber-300">{reg.avgFrp} MW</td>
                    <td className="py-3 text-rose-400 font-semibold">{reg.maxFrp} MW</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          reg.riskLevel === 'Extreme'
                            ? 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
                            : reg.riskLevel === 'Severe'
                            ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                            : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {reg.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 text-[11px]">{reg.primarySensor}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedContinent(reg.continent)}
                          className="px-2.5 py-1 rounded bg-space-950 hover:bg-space-850 border border-white/10 hover:border-nasa-cyan/40 text-[11px] text-nasa-cyan transition-colors"
                        >
                          Target Map
                        </button>
                        <button
                          onClick={() => navigate(`/hotspots?region=${encodeURIComponent(reg.country)}`)}
                          className="px-2.5 py-1 rounded bg-nasa-blue/30 hover:bg-nasa-blue/60 border border-nasa-blue/50 text-[11px] text-white transition-colors"
                        >
                          Explore
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION F: SATELLITE OBSERVATION STATUS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Satellite Observation Missions</span>
              <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 rounded bg-white/5">
                5 POLAR ORBITAL PLATFORMS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instrument specifications, latest ground downlink, and detection capture yield.
            </p>
          </div>

          <Link
            to="/satellites"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-space-900 hover:bg-space-850 border border-nasa-cyan/40 text-nasa-cyan text-xs font-mono transition-colors self-start sm:self-auto"
          >
            <span>VIEW 3D SATELLITE ORBITS &amp; MISSIONS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
          {satelliteStatuses.map((sat) => (
            <div
              key={sat.id}
              className="p-4 rounded-xl bg-space-900/80 border border-white/10 flex flex-col justify-between hover:border-nasa-cyan/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white truncate">{sat.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      sat.operationalStatus === 'NOMINAL'
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {sat.operationalStatus}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">SENSOR</span>
                    <span className="text-nasa-cyan font-semibold">{sat.sensor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">RESOLUTION</span>
                    <span className="text-white">{sat.resolution.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">LATENCY</span>
                    <span className="text-slate-400">{sat.dataLatency.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">DETECTIONS</span>
                    <span className="text-nasa-orange font-bold">{sat.detectionCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                <span className="text-slate-500 block">LATEST PASS</span>
                <span className="text-slate-300 font-mono">{sat.latestPassUtc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION G: RECENT FIRE INCIDENTS / OBSERVATIONS TABLE */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Recent Wildfire Observations</span>
              <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 rounded bg-white/5">
                {filteredTableObservations.length} OBSERVATIONS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified satellite detections. Click any observation to navigate directly into Hotspot Explorer.
            </p>
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search region, country..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-space-950 border border-white/15 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-nasa-cyan w-48 sm:w-56"
              />
            </div>

            {/* Sensor Filter */}
            <select
              value={tableSensorFilter}
              onChange={(e) => {
                setTableSensorFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-space-950 border border-white/15 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-nasa-cyan"
            >
              <option value="ALL">All Sensors</option>
              <option value="VIIRS">VIIRS Only</option>
              <option value="MODIS">MODIS Only</option>
            </select>

            {/* Confidence Filter */}
            <select
              value={tableConfidenceFilter}
              onChange={(e) => {
                setTableConfidenceFilter(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-space-950 border border-white/15 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-nasa-cyan"
            >
              <option value="0">All Confidence</option>
              <option value="80">&gt;= 80% (High)</option>
              <option value="95">&gt;= 95% (Extreme)</option>
            </select>
          </div>
        </div>

        {/* Observations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th
                  onClick={() => handleSort('time')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>TIME (UTC)</span>
                    {tableSortField === 'time' && (
                      <span className="text-nasa-cyan">{tableSortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>LOCATION</span>
                    {tableSortField === 'location' && (
                      <span className="text-nasa-cyan">{tableSortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="pb-3 font-medium">COORDINATES</th>
                <th className="pb-3 font-medium">SATELLITE &amp; SENSOR</th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>CONFIDENCE</span>
                    {tableSortField === 'confidence' && (
                      <span className="text-nasa-cyan">{tableSortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('frp')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>FRP (MW)</span>
                    {tableSortField === 'frp' && (
                      <span className="text-nasa-cyan">{tableSortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="pb-3 font-medium">BRIGHTNESS TEMP</th>
                <th className="pb-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedObservations.length > 0 ? (
                paginatedObservations.map((point) => (
                  <tr
                    key={point.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/hotspots?selected=${point.id}`)}
                  >
                    <td className="py-3 text-slate-300">
                      <div>{point.acquiredUtcString}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{point.hoursAgo}h ago</div>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-white group-hover:text-nasa-cyan transition-colors">
                        {point.region}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {point.country} &bull; {point.continent}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">
                      {point.lat.toFixed(3)}°, {point.lon.toFixed(3)}°
                    </td>
                    <td className="py-3">
                      <span className="text-nasa-cyan font-semibold">{point.specificMission}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {point.sensorFamily === 'VIIRS' ? '375m I-Band' : '1km Multi-spectral'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          point.confidence >= 90
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : point.confidence >= 70
                            ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400'
                            : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {point.confidence}%
                      </span>
                    </td>
                    <td className="py-3 font-bold text-nasa-orange">{point.frp} MW</td>
                    <td className="py-3 text-amber-300">
                      {point.brightnessTempK} K ({point.brightnessTempC}°C)
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hotspots?selected=${point.id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-nasa-blue/30 hover:bg-nasa-blue/70 border border-nasa-cyan/40 text-nasa-cyan text-[11px] font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <span>EXPLORE</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No wildfire observations matched the active search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10 text-xs font-mono">
            <div className="text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTableObservations.length)} of{' '}
              {filteredTableObservations.length} entries
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-space-950 border border-white/15 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>

              <div className="px-3 py-1.5 rounded-lg bg-space-900 border border-white/10 text-nasa-cyan font-bold">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-space-950 border border-white/15 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION H: DATA SOURCES AND DATA FRESHNESS */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-space-900/60 border border-white/10 text-xs font-mono text-slate-400 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2 text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold tracking-wider">DATA SOURCES &amp; SCIENTIFIC TRANSPARENCY</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            LATEST TELEMETRY RETRIEVAL: {globalMetrics.lastUpdatedUtc}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Source 1 */}
          <div className="space-y-1.5">
            <div className="font-mono text-white text-xs font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-nasa-cyan" />
              <span>NASA FIRMS Level-2 Telemetry</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Active fire and thermal anomaly detections distributed by the NASA Earth Science Data and Information System (ESDIS) / LANCE FIRMS. Derived from MODIS (MOD14 / MYD14) and VIIRS (VNP14IMGTDL / VJ114IMGTDL).
            </p>
          </div>

          {/* Latency disclosure */}
          <div className="space-y-1.5">
            <div className="font-mono text-white text-xs font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Downlink &amp; Processing Latency</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard orbital passes are downlinked, georeferenced, and calibrated within ~3 to 4 hours of satellite nadir overpass. Ultra Real-Time (URT) direct broadcast downlinks achieve ~30 to 60 minute latencies. Observations are not live feeds.
            </p>
          </div>

          {/* Scientific disclaimer */}
          <div className="space-y-1.5">
            <div className="font-mono text-white text-xs font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Independent Earth Observation</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Thermal detections indicate elevated middle/thermal-infrared emissions at pixel level. Ground validation may be required. FireSync provides independent Earth-observation visualization; this platform is not officially endorsed by NASA or NOAA.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5 text-[11px]">
          <div className="flex items-center space-x-4">
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nasa-cyan hover:underline flex items-center space-x-1"
            >
              <span>NASA FIRMS Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://worldview.earthdata.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nasa-cyan hover:underline flex items-center space-x-1"
            >
              <span>NASA GIBS Imagery Layers</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <span className="text-slate-500 font-mono text-[10px]">
            FireSync Phase 1 // Global Earth Observation Telemetry
          </span>
        </div>
      </div>
    </div>
  );
};
