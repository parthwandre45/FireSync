import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import { 
  Flame, 
  Satellite, 
  Layers, 
  Filter, 
  Info, 
  Sliders, 
  Calendar, 
  Clock, 
  MapPin, 
  Crosshair, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Radio, 
  Activity, 
  Zap, 
  Compass,
  ArrowUpRight,
  Eye,
  X
} from 'lucide-react';
import { LiveBadge, DemoBadge } from '../components/common/DemoBadge';
import { INDIA_BOUNDS, INDIA_STATES } from '../data/indiaGeographicData';
import { fetchLiveFires } from '../services/api';

// Helper component to re-center map programmatically
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Haversine distance in meters
function computeHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Format UTC to Indian Standard Time (IST = UTC + 5:30)
function formatToIST(acqDate, acqTime) {
  if (!acqDate) return 'N/A';
  try {
    const timeStr = String(acqTime || '0000').padStart(4, '0');
    const hours = parseInt(timeStr.substring(0, 2), 10);
    const mins = parseInt(timeStr.substring(2, 4), 10);
    const dateObj = new Date(`${acqDate}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000Z`);
    
    // Convert to IST
    const istTime = new Date(dateObj.getTime() + (5.5 * 3600 * 1000));
    return istTime.toUTCString().replace('GMT', 'IST');
  } catch (err) {
    return `${acqDate} ${acqTime || ''} UTC`;
  }
}

export const HotspotExplorerPage = () => {
  // -------------------------------------------------------------
  // Filter States
  // -------------------------------------------------------------
  const [activeSensor, setActiveSensor] = useState('ALL'); // 'ALL', 'MODIS', 'VIIRS'
  const [selectedStateId, setSelectedStateId] = useState('ALL');
  const [selectedDistrictId, setSelectedDistrictId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minFRP, setMinFRP] = useState(0);
  const [confidenceFilter, setConfidenceFilter] = useState('ALL'); // 'ALL', 'HIGH', 'NOMINAL'
  const [dayNightFilter, setDayNightFilter] = useState('ALL'); // 'ALL', 'D', 'N'
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // Map View State
  // -------------------------------------------------------------
  const [mapCenter, setMapCenter] = useState(INDIA_BOUNDS.center);
  const [mapZoom, setMapZoom] = useState(INDIA_BOUNDS.zoom);
  const [selectedObservation, setSelectedObservation] = useState(null);

  // -------------------------------------------------------------
  // Data & Network States
  // -------------------------------------------------------------
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [totalDatabaseCount, setTotalDatabaseCount] = useState(0);
  const [tileLoadError, setTileLoadError] = useState(false);

  // Pagination & Database Population Metrics
  const [pageLimit, setPageLimit] = useState(2500);
  const [pageOffset, setPageOffset] = useState(0);
  const [matchingStats, setMatchingStats] = useState({
    totalMatching: 0,
    totalModis: 0,
    totalViirs: 0,
    totalScope: 0,
  });
  const [paginationInfo, setPaginationInfo] = useState({
    totalMatching: 0,
    limit: 2500,
    offset: 0,
    returnedCount: 0,
    hasMore: false,
  });

  // Available districts for current state
  const currentStateObj = useMemo(() => {
    return INDIA_STATES.find((s) => s.id === selectedStateId) || INDIA_STATES[0];
  }, [selectedStateId]);

  const availableDistricts = useMemo(() => {
    return currentStateObj.districts || [];
  }, [currentStateObj]);

  // Handle State Change
  const handleStateChange = (stateId) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId('ALL');
    setPageOffset(0);
    const stateObj = INDIA_STATES.find((s) => s.id === stateId) || INDIA_STATES[0];
    setMapCenter(stateObj.center);
    setMapZoom(stateObj.zoom);
    setSelectedObservation(null);
  };

  // Handle District Change
  const handleDistrictChange = (districtId) => {
    setSelectedDistrictId(districtId);
    setPageOffset(0);
    if (districtId === 'ALL' || districtId === `ALL_${selectedStateId}`) {
      setMapCenter(currentStateObj.center);
      setMapZoom(currentStateObj.zoom);
    } else {
      const distObj = availableDistricts.find((d) => d.id === districtId);
      if (distObj) {
        setMapCenter(distObj.center);
        setMapZoom(distObj.zoom);
      }
    }
    setSelectedObservation(null);
  };

  // Handle Sensor Filter Change
  const handleSensorChange = (sensor) => {
    setActiveSensor(sensor);
    setPageOffset(0);
    setSelectedObservation(null);
  };

  // -------------------------------------------------------------
  // Load Observations from Backend
  // -------------------------------------------------------------
  const loadObservations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = {
        country: 'IND',
        limit: pageLimit,
        offset: pageOffset,
      };

      if (activeSensor !== 'ALL') params.sensor = activeSensor;
      if (minFRP > 0) params.minFrp = minFRP;
      if (confidenceFilter !== 'ALL') params.confidence = confidenceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Geographic Bounding Box if specific district or state selected
      let activeBounds = null;
      if (selectedDistrictId && selectedDistrictId !== 'ALL' && !selectedDistrictId.startsWith('ALL_')) {
        const distObj = availableDistricts.find((d) => d.id === selectedDistrictId);
        if (distObj && distObj.bounds) activeBounds = distObj.bounds;
      } else if (selectedStateId !== 'ALL') {
        if (currentStateObj.bounds) activeBounds = currentStateObj.bounds;
      }

      if (activeBounds) {
        params.minLat = activeBounds[0][0];
        params.minLon = activeBounds[0][1];
        params.maxLat = activeBounds[1][0];
        params.maxLon = activeBounds[1][1];
      }

      const res = await fetchLiveFires(params);
      if (res.success && Array.isArray(res.records)) {
        setObservations(res.records);
        const total = res.pagination?.totalMatching || res.matchingStats?.totalMatching || res.count || res.records.length;
        setTotalDatabaseCount(total);
        if (res.matchingStats) {
          setMatchingStats(res.matchingStats);
        }
        if (res.pagination) {
          setPaginationInfo(res.pagination);
        }
      } else {
        throw new Error(res.error || 'Failed to retrieve active fire records from server');
      }
    } catch (err) {
      console.error('Error fetching observations:', err);
      const isNetworkError = err.message === 'Network Error' || (err.message && err.message.includes('Network'));
      const friendlyMsg = isNetworkError
        ? 'Cannot reach FireSync Express Gateway on port 5000. Ensure the backend and PostgreSQL services are running.'
        : (err.message || 'Unable to retrieve live NASA observations from database');
      setErrorMessage(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeSensor,
    minFRP,
    confidenceFilter,
    startDate,
    endDate,
    selectedStateId,
    selectedDistrictId,
    currentStateObj,
    availableDistricts,
    pageLimit,
    pageOffset,
  ]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  // Client-side quick filter for text search and day/night
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Day/Night filter
      if (dayNightFilter !== 'ALL' && obs.daynight !== dayNightFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sat = (obs.satellite || '').toLowerCase();
        const sensor = (obs.sensor || '').toLowerCase();
        const id = (obs.id || '').toLowerCase();
        return sat.includes(q) || sensor.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [observations, dayNightFilter, searchQuery]);

  // Separate MODIS and VIIRS records for rendering
  const modisObservations = useMemo(() => {
    return filteredObservations.filter((o) => o.sensor === 'MODIS');
  }, [filteredObservations]);

  const viirsObservations = useMemo(() => {
    return filteredObservations.filter((o) => o.sensor === 'VIIRS');
  }, [filteredObservations]);

  // -------------------------------------------------------------
  // Find Nearby Observations from Opposite Sensor
  // -------------------------------------------------------------
  const nearbyOppositeSensorObservations = useMemo(() => {
    if (!selectedObservation) return [];

    const isTargetModis = selectedObservation.sensor === 'MODIS';
    const oppositePool = isTargetModis ? viirsObservations : modisObservations;
    const targetLat = parseFloat(selectedObservation.latitude);
    const targetLon = parseFloat(selectedObservation.longitude);
    const targetTime = new Date(selectedObservation.acq_timestamp).getTime();

    const candidates = [];
    for (const opp of oppositePool) {
      const oppLat = parseFloat(opp.latitude);
      const oppLon = parseFloat(opp.longitude);
      const distM = computeHaversineDistanceMeters(targetLat, targetLon, oppLat, oppLon);

      // Look within 10 km
      if (distM <= 10000) {
        const oppTime = new Date(opp.acq_timestamp).getTime();
        const timeDiffMinutes = Math.round(Math.abs(targetTime - oppTime) / 60000);

        // Coincident match threshold: within 1500m and 120 minutes
        const isCandidateCoincident = distM <= 1500 && timeDiffMinutes <= 120;

        candidates.push({
          observation: opp,
          distanceM: distM,
          distanceKm: (distM / 1000).toFixed(2),
          timeDiffMinutes,
          isCandidateCoincident,
        });
      }
    }

    // Sort by spatial proximity
    candidates.sort((a, b) => a.distanceM - b.distanceM);
    return candidates.slice(0, 5); // top 5 closest
  }, [selectedObservation, modisObservations, viirsObservations]);

  // Reset Filters Helper
  const handleResetFilters = () => {
    setActiveSensor('ALL');
    setSelectedStateId('ALL');
    setSelectedDistrictId('ALL');
    setStartDate('');
    setEndDate('');
    setMinFRP(0);
    setConfidenceFilter('ALL');
    setDayNightFilter('ALL');
    setSearchQuery('');
    setMapCenter(INDIA_BOUNDS.center);
    setMapZoom(INDIA_BOUNDS.zoom);
    setSelectedObservation(null);
    setPageOffset(0);
  };

  return (
    <div className="space-y-5">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Live Telemetry Badge                              */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-fire-600/20 border border-fire-500/40 flex items-center justify-center text-fire-500 shadow-inner">
                <Flame className="w-5 h-5 text-fire-500" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                  <span>Geospatial Hotspot Explorer: India</span>
                  <LiveBadge size="xs" count={filteredObservations.length} />
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-fidelity cartography synthesized from live NASA MODIS (~1km) and VIIRS (375m) satellite observations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search & Reload Button */}
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search satellite or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={loadObservations}
              disabled={isLoading}
              title="Refresh live data from PostgreSQL"
              className="px-3 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-fire-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Comprehensive Filter Controls Bar                             */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          
          {/* 1. Sensor Toggle */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Layers className="w-3 h-3 text-fire-500" />
              <span>Sensor Feed:</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-space-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'MODIS', label: 'MODIS' },
                { id: 'VIIRS', label: 'VIIRS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSensorChange(tab.id)}
                  className={`py-1 rounded-lg text-center font-medium transition-all ${
                    activeSensor === tab.id
                      ? 'bg-fire-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Indian State Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-nasa-cyan" />
              <span>State / Territory:</span>
            </label>
            <select
              value={selectedStateId}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-space-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-fire-500"
            >
              {INDIA_STATES.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. District Selector (dynamic based on selected state) */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Crosshair className="w-3 h-3 text-emerald-400" />
              <span>District Filter:</span>
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={availableDistricts.length === 0}
              className="w-full px-2.5 py-1.5 rounded-xl bg-space-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-fire-500 disabled:opacity-40"
            >
              {availableDistricts.length === 0 ? (
                <option value="ALL">Select State First</option>
              ) : (
                availableDistricts.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 4. Date Range Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Date Filter:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPageOffset(0); }}
                placeholder="Start"
                className="w-full px-2 py-1 rounded-xl bg-space-900 border border-slate-800 text-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-fire-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPageOffset(0); }}
                placeholder="End"
                className="w-full px-2 py-1 rounded-xl bg-space-900 border border-slate-800 text-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-fire-500"
              />
            </div>
          </div>

          {/* 5. Min FRP Filter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Min FRP:</span>
              </span>
              <span className="text-amber-400 font-bold">{minFRP} MW</span>
            </div>
            <div className="pt-1">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minFRP}
                onChange={(e) => { setMinFRP(Number(e.target.value)); setPageOffset(0); }}
                className="w-full accent-fire-500 cursor-pointer h-1.5 bg-space-900 rounded-lg"
              />
            </div>
          </div>

        </div>

        {/* Active Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-slate-500">Active Criteria:</span>
            <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-slate-300">
              Sensor: <strong className="text-white">{activeSensor}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-slate-300">
              State: <strong className="text-white">{currentStateObj.name}</strong>
            </span>
            {selectedDistrictId !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-slate-300">
                District: <strong className="text-white">{availableDistricts.find(d => d.id === selectedDistrictId)?.name || selectedDistrictId}</strong>
              </span>
            )}
            {minFRP > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-amber-400">
                FRP ≥ {minFRP} MW
              </span>
            )}
            {(startDate || endDate) && (
              <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-cyan-400">
                Window: {startDate || 'Start'} → {endDate || 'End'}
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-white underline decoration-slate-700 hover:decoration-fire-500 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Two-Column Viewport: Map & Inspector Panel             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Columns: Leaflet Map Container */}
        <div className="lg:col-span-2 glass-panel p-3 rounded-2xl border border-slate-800 relative flex flex-col">
          
          {/* Map Status Bar & Pagination Controls */}
          <div className="px-3 py-2.5 text-xs text-slate-400 border-b border-slate-800/80 mb-2 space-y-2">
            
            {/* Row 1: PostgreSQL Database Totals vs Viewport Markers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Database Matching:
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 inline-block shadow-xs" />
                  <span className="font-mono text-slate-300">
                    MODIS: <strong className="text-amber-400 font-bold">{matchingStats.totalModis.toLocaleString()}</strong>
                  </span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 inline-block shadow-xs" />
                  <span className="font-mono text-slate-300">
                    VIIRS: <strong className="text-red-400 font-bold">{matchingStats.totalViirs.toLocaleString()}</strong>
                  </span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  (Total: <strong className="text-emerald-400 font-bold">{matchingStats.totalMatching.toLocaleString()}</strong>)
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-300 flex items-center space-x-2">
                <span>Map Markers:</span>
                <span className="px-2 py-0.5 rounded-md bg-space-900 border border-slate-800 text-white font-bold">
                  {observations.length.toLocaleString()} loaded
                </span>
                <span className="text-slate-500 text-[10px]">
                  ({modisObservations.length} MODIS / {viirsObservations.length} VIIRS)
                </span>
              </div>
            </div>

            {/* Row 2: Pagination & Batch Size Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/50 text-[11px]">
              <div className="text-slate-400 font-mono">
                Showing observations <strong className="text-slate-200">{matchingStats.totalMatching > 0 ? pageOffset + 1 : 0}</strong>–
                <strong className="text-slate-200">{Math.min(pageOffset + observations.length, matchingStats.totalMatching)}</strong> of{' '}
                <strong className="text-emerald-400">{matchingStats.totalMatching.toLocaleString()}</strong>
                {matchingStats.totalMatching > pageLimit && (
                  <span className="text-slate-500 ml-2">
                    (Page {Math.floor(pageOffset / pageLimit) + 1} of {Math.max(1, Math.ceil(matchingStats.totalMatching / pageLimit))})
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Batch Limit Selector */}
                <div className="flex items-center space-x-1 font-mono text-slate-400">
                  <span className="text-[10px]">Batch:</span>
                  {[1500, 2500, 5000].map((lim) => (
                    <button
                      key={lim}
                      onClick={() => { setPageLimit(lim); setPageOffset(0); }}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${
                        pageLimit === lim
                          ? 'bg-fire-600 text-white font-bold'
                          : 'bg-space-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {lim >= 1000 ? `${lim / 1000}k` : lim}
                    </button>
                  ))}
                </div>

                {/* Pagination Prev/Next Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPageOffset((prev) => Math.max(0, prev - pageLimit))}
                    disabled={pageOffset === 0 || isLoading}
                    className="px-2 py-0.5 rounded bg-space-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[10px]"
                  >
                    ◀ Prev
                  </button>
                  <button
                    onClick={() => setPageOffset((prev) => prev + pageLimit)}
                    disabled={!paginationInfo.hasMore || isLoading}
                    className="px-2 py-0.5 rounded bg-space-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[10px]"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Map Box */}
          <div className="h-[560px] w-full rounded-xl overflow-hidden border border-slate-800 relative bg-space-950 shadow-inner">
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-space-950/70 backdrop-blur-xs z-[1000] flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-fire-500/20 border-t-fire-500 rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-300">
                  Retrieving NASA Active Fire Detections...
                </p>
              </div>
            )}

            {/* Error Overlay */}
            {!isLoading && errorMessage && (
              <div className="absolute inset-0 bg-space-950/90 z-[1000] flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <h3 className="text-sm font-bold text-white">Database Query Notice</h3>
                <p className="text-xs text-slate-300 max-w-md">{errorMessage}</p>
                <button
                  onClick={loadObservations}
                  className="px-4 py-2 rounded-xl bg-fire-600 hover:bg-fire-500 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Query</span>
                </button>
              </div>
            )}

            {/* Empty State Overlay */}
            {!isLoading && !errorMessage && filteredObservations.length === 0 && (
              <div className="absolute inset-0 bg-space-950/80 z-[1000] flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Flame className="w-10 h-10 text-slate-600" />
                <h3 className="text-sm font-bold text-white">No Thermal Anomalies Found</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  No NASA active-fire observations match your current filter parameters for this region and date window.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 rounded-xl bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Tile Loading Warning Notification */}
            {tileLoadError && (
              <div className="absolute top-3 left-14 z-[400] bg-space-950/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>OpenStreetMap tile server is slow or unreachable. Hotspot observations remain active over coordinates.</span>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | NASA FIRMS EOSDIS'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                eventHandlers={{
                  tileerror: () => {
                    setTileLoadError(true);
                  },
                  tileload: () => {
                    setTileLoadError(false);
                  },
                }}
              />

              {/* MODIS Points (Orange / Amber Nominal 1km markers) */}
              {(activeSensor === 'ALL' || activeSensor === 'MODIS') &&
                modisObservations.map((obs) => {
                  const lat = parseFloat(obs.latitude);
                  const lon = parseFloat(obs.longitude);
                  const isSelected = selectedObservation?.id === obs.id;

                  return (
                    <CircleMarker
                      key={`MODIS-${obs.id}`}
                      center={[lat, lon]}
                      radius={isSelected ? 14 : 9}
                      pathOptions={{
                        color: isSelected ? '#ffffff' : '#fb923c',
                        fillColor: '#f97316',
                        fillOpacity: 0.75,
                        weight: isSelected ? 3 : 1.5,
                        dashArray: isSelected ? null : '3, 3', // dashed to represent 1 km footprint integration
                      }}
                      eventHandlers={{
                        click: () => setSelectedObservation(obs),
                      }}
                    >
                      <Popup className="text-slate-900 font-sans">
                        <div className="text-xs p-1 space-y-1">
                          <div className="font-bold text-amber-700 flex items-center space-x-1">
                            <Flame className="w-3.5 h-3.5" />
                            <span>NASA MODIS (~1 km nadir)</span>
                          </div>
                          <div>Platform: <strong>{obs.satellite}</strong> ({obs.instrument})</div>
                          <div>FRP: <strong>{obs.frp_mw != null ? `${obs.frp_mw} MW` : 'N/A'}</strong></div>
                          <div>Brightness: {obs.brightness_kelvin} K</div>
                          <div>Confidence: <strong>{obs.confidence_percent !== null ? `${obs.confidence_percent}%` : obs.confidence_raw}</strong> ({obs.confidence_normalized})</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Acq: {obs.acq_date} {obs.acq_time} UTC
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

              {/* VIIRS Points (Crimson Red Sharp 375m markers) */}
              {(activeSensor === 'ALL' || activeSensor === 'VIIRS') &&
                viirsObservations.map((obs) => {
                  const lat = parseFloat(obs.latitude);
                  const lon = parseFloat(obs.longitude);
                  const isSelected = selectedObservation?.id === obs.id;

                  return (
                    <CircleMarker
                      key={`VIIRS-${obs.id}`}
                      center={[lat, lon]}
                      radius={isSelected ? 10 : 5.5}
                      pathOptions={{
                        color: isSelected ? '#ffffff' : '#ef4444',
                        fillColor: '#dc2626',
                        fillOpacity: 0.85,
                        weight: isSelected ? 2.5 : 1,
                      }}
                      eventHandlers={{
                        click: () => setSelectedObservation(obs),
                      }}
                    >
                      <Popup className="text-slate-900 font-sans">
                        <div className="text-xs p-1 space-y-1">
                          <div className="font-bold text-red-600 flex items-center space-x-1">
                            <Flame className="w-3.5 h-3.5" />
                            <span>NASA VIIRS (375 m I-band)</span>
                          </div>
                          <div>Platform: <strong>{obs.satellite}</strong> ({obs.instrument})</div>
                          <div>FRP: <strong>{obs.frp_mw} MW</strong></div>
                          <div>Brightness: {obs.brightness_kelvin} K</div>
                          <div>Confidence: <strong>{obs.confidence_raw}</strong> (Categorical)</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Acq: {obs.acq_date} {obs.acq_time} UTC
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>

            {/* Map Floating Legend */}
            <div className="absolute bottom-3 left-3 bg-space-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl z-[400] text-[11px] space-y-1.5 shadow-lg">
              <div className="font-bold text-slate-200">Sensor Legend</div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-300 border-dashed inline-block" />
                <span className="text-slate-300">MODIS (~1 km footprint)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 inline-block" />
                <span className="text-slate-300">VIIRS (375 m footprint)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Observation Detail Inspector & Cross-Sensor Matcher */}
        <div className="space-y-4">
          
          {/* Observation Details Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-fire-500" />
                <span>Observation Inspector</span>
              </h2>
              {selectedObservation && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedObservation.sensor === 'MODIS'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {selectedObservation.sensor}
                </span>
              )}
            </div>

            {selectedObservation ? (
              <div className="space-y-3.5 text-xs">
                
                {/* Coordinates & Location Header */}
                <div className="p-3 rounded-xl bg-space-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-mono text-[11px]">Coordinates:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {parseFloat(selectedObservation.latitude).toFixed(4)}°N, {parseFloat(selectedObservation.longitude).toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-mono text-[11px]">Region:</span>
                    <span className="text-slate-200">{selectedObservation.country_code || 'India (IND)'}</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-mono">Fire Radiative Power</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {selectedObservation.frp_mw != null ? `${selectedObservation.frp_mw} MW` : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-mono">Brightness Temp</div>
                    <div className="text-sm font-bold text-orange-400 mt-0.5">
                      {selectedObservation.brightness_kelvin} <span className="text-[10px] text-slate-400">K</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-mono">Satellite Platform</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedObservation.satellite} ({selectedObservation.instrument})
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-mono">Orbit Pass</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedObservation.daynight === 'D' ? 'Daytime (D)' : 'Nighttime (N)'}
                    </div>
                  </div>
                </div>

                {/* Confidence & Quality Section */}
                <div className="p-3 rounded-xl bg-space-900 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-slate-400">NASA Confidence:</span>
                    <span className="font-bold text-slate-200">
                      {selectedObservation.sensor === 'MODIS' ? (
                        <span className="text-emerald-400">
                          {selectedObservation.confidence_percent !== null ? `${selectedObservation.confidence_percent}%` : selectedObservation.confidence_raw} ({selectedObservation.confidence_normalized})
                        </span>
                      ) : (
                        <span className="text-cyan-400">
                          {selectedObservation.confidence_raw} (Categorical)
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedObservation.sensor === 'VIIRS' && (
                    <div className="text-[10px] text-slate-500 italic">
                      NASA reports VIIRS confidence as low, nominal, or high. No numeric percentage is fabricated.
                    </div>
                  )}
                  {selectedObservation.estimated_internal_score !== null && (
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Internal Score:</span>
                      <span className="font-mono text-slate-300">{selectedObservation.estimated_internal_score}/100</span>
                    </div>
                  )}
                </div>

                {/* Timestamp & Lineage */}
                <div className="p-3 rounded-xl bg-space-900 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">UTC Overpass:</span>
                    <span className="font-mono text-slate-200">{selectedObservation.acq_date} {selectedObservation.acq_time} UTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Local Time (IST):</span>
                    <span className="font-mono text-slate-300">
                      {formatToIST(selectedObservation.acq_date, selectedObservation.acq_time)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Product / Footprint:</span>
                    <span className="font-mono text-slate-300">
                      {selectedObservation.pixel_footprint_km2} km² (nominal)
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 px-4 space-y-2">
                <Crosshair className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Click any marker on the map to inspect full NASA observation metadata.
                </p>
              </div>
            )}
          </div>

          {/* Cross-Sensor Proximity Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Compass className="w-4 h-4 text-nasa-cyan" />
                <span>Nearby Cross-Sensor Detections</span>
              </h3>
              {selectedObservation && (
                <span className="text-[10px] font-mono text-slate-400">
                  within 10 km
                </span>
              )}
            </div>

            {selectedObservation ? (
              nearbyOppositeSensorObservations.length > 0 ? (
                <div className="space-y-2 text-xs">
                  <p className="text-[11px] text-slate-400">
                    Detections from <strong className="text-white">{selectedObservation.sensor === 'MODIS' ? 'VIIRS' : 'MODIS'}</strong> in spatial proximity:
                  </p>

                  {nearbyOppositeSensorObservations.map((item, idx) => (
                    <div
                      key={`NEARBY-${idx}`}
                      onClick={() => setSelectedObservation(item.observation)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        item.isCandidateCoincident
                          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                          : 'bg-space-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center space-x-1">
                          <span>{item.observation.sensor} ({item.observation.satellite})</span>
                          {item.isCandidateCoincident && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                              Candidate Match
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">
                          {item.observation.frp_mw != null ? `${item.observation.frp_mw} MW` : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Distance: <strong className="text-slate-300">{item.distanceM} m</strong></span>
                        <span>Δt: <strong className="text-slate-300">{item.timeDiffMinutes} min</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No observations from the opposite sensor detected within 10 km.
                </div>
              )
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Select an observation above to view cross-sensor proximity.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
