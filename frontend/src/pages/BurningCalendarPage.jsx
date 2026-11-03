import React, { useState, useEffect, useMemo, useCallback } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { 
  Calendar as CalendarIcon, 
  Flame, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Info,
  CalendarDays,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Layers,
  MapPin,
  RefreshCw,
  Zap,
  Compass,
  Satellite,
  ChevronDown
} from 'lucide-react';
import { INDIA_STATES } from '../data/indiaGeographicData';
import { fetchBurningCalendar, fetchLiveFires } from '../services/api';

const Plot = createPlotlyComponent(Plotly);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const BurningCalendarPage = ({ selectedRegion }) => {
  // 1. Filter States
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(10); // Default to October 2026 (Live FIRMS window)
  const [selectedStateId, setSelectedStateId] = useState('ALL');
  const [selectedDistrictId, setSelectedDistrictId] = useState('ALL');
  const [selectedMetric, setSelectedMetric] = useState('frp'); // 'frp', 'burned_area', 'detections'
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'seasonality', 'methodology'

  // 2. Data States
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Selected Day State & Observations
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayObservations, setDayObservations] = useState([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [observationError, setObservationError] = useState(null);

  // Current State object & Districts list
  const currentState = useMemo(() => {
    return INDIA_STATES.find((s) => s.id === selectedStateId) || INDIA_STATES[0];
  }, [selectedStateId]);

  const availableDistricts = useMemo(() => {
    return currentState.districts || [];
  }, [currentState]);

  const currentDistrict = useMemo(() => {
    if (selectedDistrictId === 'ALL') return null;
    return availableDistricts.find((d) => d.id === selectedDistrictId) || null;
  }, [availableDistricts, selectedDistrictId]);

  // Compute Active Coordinate Bounding Box
  const activeBounds = useMemo(() => {
    if (currentDistrict && currentDistrict.bounds) {
      return {
        minLat: currentDistrict.bounds[0][0],
        minLon: currentDistrict.bounds[0][1],
        maxLat: currentDistrict.bounds[1][0],
        maxLon: currentDistrict.bounds[1][1],
        name: `${currentDistrict.name}, ${currentState.name}`,
      };
    }
    if (currentState && currentState.bounds && currentState.id !== 'ALL') {
      return {
        minLat: currentState.bounds[0][0],
        minLon: currentState.bounds[0][1],
        maxLat: currentState.bounds[1][0],
        maxLon: currentState.bounds[1][1],
        name: currentState.name,
      };
    }
    return {
      minLat: 8.0,
      minLon: 68.0,
      maxLat: 37.0,
      maxLon: 97.5,
      name: 'All India (National Overview)',
    };
  }, [currentState, currentDistrict]);

  // 4. Fetch Calendar Data
  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        year: selectedYear,
        month: selectedMonth,
        regionName: activeBounds.name,
      };

      if (currentState.id !== 'ALL' || selectedDistrictId !== 'ALL') {
        params.minLat = activeBounds.minLat;
        params.maxLat = activeBounds.maxLat;
        params.minLon = activeBounds.minLon;
        params.maxLon = activeBounds.maxLon;
      }

      const res = await fetchBurningCalendar(params);
      if (res && res.success) {
        setCalendarData(res);
        // Automatically select the peak day or the first active day
        const days = res.calendarDays || [];
        const activeDays = days.filter((d) => d.hasData);
        if (activeDays.length > 0) {
          const peak = res.monthSummary?.peakBurningDay;
          const initialDay = peak ? activeDays.find((d) => d.date === peak.date) || activeDays[0] : activeDays[0];
          setSelectedDay(initialDay);
        } else {
          setSelectedDay(days[0] || null);
        }
      } else {
        setError(res?.error || 'Failed to retrieve burning activity calendar.');
      }
    } catch (err) {
      console.error('Calendar load error:', err);
      setError(err.message || 'Network error communicating with FireSync backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, activeBounds, currentState.id, selectedDistrictId]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // 5. Fetch Daily Observations when selectedDay changes
  const loadDayObservations = useCallback(async (dayObj) => {
    if (!dayObj || !dayObj.hasData) {
      setDayObservations([]);
      return;
    }
    setLoadingObservations(true);
    setObservationError(null);
    try {
      const params = {
        startDate: dayObj.date,
        endDate: dayObj.date,
        limit: 50,
      };
      if (currentState.id !== 'ALL' || selectedDistrictId !== 'ALL') {
        params.minLat = activeBounds.minLat;
        params.maxLat = activeBounds.maxLat;
        params.minLon = activeBounds.minLon;
        params.maxLon = activeBounds.maxLon;
      }
      const res = await fetchLiveFires(params);
      if (res && res.records) {
        setDayObservations(res.records);
      } else {
        setDayObservations([]);
      }
    } catch (err) {
      console.error('Error fetching day observations:', err);
      setObservationError('Could not load detailed observations for this date.');
      setDayObservations([]);
    } finally {
      setLoadingObservations(false);
    }
  }, [activeBounds, currentState.id, selectedDistrictId]);

  useEffect(() => {
    if (selectedDay) {
      loadDayObservations(selectedDay);
    }
  }, [selectedDay, loadDayObservations]);

  // Color mapping for Heatmap cells based on activity level
  const getActivityColorClasses = (level, isSelected) => {
    const selectedRing = isSelected ? 'ring-2 ring-fire-400 ring-offset-2 ring-offset-space-950 scale-[1.02]' : '';
    switch (level) {
      case 'EXTREME':
        return `bg-gradient-to-br from-red-950/70 via-red-900/60 to-orange-950/70 border-red-500/80 text-red-100 shadow-md shadow-red-950/50 hover:border-red-400 ${selectedRing}`;
      case 'HIGH':
        return `bg-gradient-to-br from-orange-950/60 via-amber-950/50 to-space-900/80 border-orange-500/70 text-orange-100 hover:border-orange-400 ${selectedRing}`;
      case 'MODERATE':
        return `bg-gradient-to-br from-amber-950/40 via-space-900/60 to-space-900/80 border-amber-600/50 text-amber-200 hover:border-amber-400 ${selectedRing}`;
      case 'LOW':
        return `bg-gradient-to-br from-emerald-950/30 via-space-900/50 to-space-900/80 border-emerald-700/40 text-emerald-300 hover:border-emerald-500 ${selectedRing}`;
      case 'NONE':
      default:
        return `bg-space-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700 hover:bg-space-900/70 ${selectedRing}`;
    }
  };

  // Helper to switch months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const summary = calendarData?.monthSummary || {};
  const calendarDays = calendarData?.calendarDays || [];
  const seasonal = calendarData?.seasonalAnalysis || {};
  const monthlyPattern = calendarData?.historicalMonthlyPattern || [];

  // Prepare chart series from active days
  const activeDaysForPlot = useMemo(() => {
    return calendarDays.filter((d) => d.hasData);
  }, [calendarDays]);

  const plotDates = activeDaysForPlot.map((d) => d.date);
  const plotModisFrp = activeDaysForPlot.map((d) => d.frpSummaries?.modisFrpMw?.sum || 0);
  const plotViirsFrp = activeDaysForPlot.map((d) => d.frpSummaries?.viirsFrpMw?.sum || 0);
  const plotHarmonizedFrp = activeDaysForPlot.map((d) => d.frpSummaries?.harmonizedActivityFrpMw || 0);
  const plotBurnedArea = activeDaysForPlot.map((d) => d.burnedAreaEst?.nominalHa || 0);
  const plotEffectiveCount = activeDaysForPlot.map((d) => d.observationCounts?.effectiveIndependentDetections || 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Filters Glass Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Title, Badges & Month/Year Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-fire-500" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Harmonized Burning Activity Calendar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                <span>REAL NASA FIRMS DATA</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80">
                EXPERIMENTAL_UNCALIBRATED PROXY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Region: <strong className="text-slate-200">{activeBounds.name}</strong></span>
              <span>•</span>
              <span className="text-amber-300/80 text-[11px]">Unvalidated experimental research metric; not ground-truth perimeter data</span>
              <span>•</span>
              <span className="font-mono text-slate-400 text-[11px]">
                Bounds: [{activeBounds.minLat.toFixed(1)}°N, {activeBounds.minLon.toFixed(1)}°E] to [{activeBounds.maxLat.toFixed(1)}°N, {activeBounds.maxLon.toFixed(1)}°E]
              </span>
            </p>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick Month Jumpers */}
            <div className="flex items-center rounded-xl bg-space-900/90 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => { setSelectedYear(2026); setSelectedMonth(10); }}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all ${
                  selectedYear === 2026 && selectedMonth === 10
                    ? 'bg-fire-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Oct 2026 (Live)
              </button>
              <button
                onClick={() => { setSelectedYear(2026); setSelectedMonth(11); }}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all ${
                  selectedYear === 2026 && selectedMonth === 11
                    ? 'bg-fire-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nov 2026 (Live)
              </button>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center space-x-1 bg-space-900/90 rounded-xl p-1 border border-slate-800">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-2 font-mono text-xs font-bold text-white min-w-[110px] text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Reload button */}
            <button
              onClick={loadCalendar}
              disabled={loading}
              className="p-2 rounded-xl bg-space-900/90 border border-slate-800 text-slate-400 hover:text-nasa-cyan hover:bg-space-800 transition-colors"
              title="Refresh Calendar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-nasa-cyan' : ''}`} />
            </button>
          </div>
        </div>

        {/* Geographic Selection Bar & Metric Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* State Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-fire-500" />
              <span>State / Region:</span>
            </label>
            <div className="relative">
              <select
                value={selectedStateId}
                onChange={(e) => {
                  setSelectedStateId(e.target.value);
                  setSelectedDistrictId('ALL');
                }}
                className="w-full bg-space-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white appearance-none focus:outline-none focus:border-fire-500 font-mono text-xs pr-8"
              >
                {INDIA_STATES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* District Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>District (where available):</span>
            </label>
            <div className="relative">
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                disabled={availableDistricts.length === 0}
                className="w-full bg-space-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white appearance-none focus:outline-none focus:border-fire-500 font-mono text-xs pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableDistricts.length === 0 ? (
                  <option value="ALL">No district boundaries configured</option>
                ) : (
                  availableDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Metric Selector Toggle */}
          <div className="space-y-1 md:col-span-1 lg:col-span-2">
            <label className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-nasa-gold" />
              <span>Calendar Heatmap Metric:</span>
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-space-900/90 p-1 border border-slate-800">
              <button
                onClick={() => setSelectedMetric('frp')}
                className={`py-1 px-2 rounded-lg text-center transition-all font-mono text-[11px] ${
                  selectedMetric === 'frp'
                    ? 'bg-fire-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Harmonized FRP
              </button>
              <button
                onClick={() => setSelectedMetric('burned_area')}
                className={`py-1 px-2 rounded-lg text-center transition-all font-mono text-[11px] ${
                  selectedMetric === 'burned_area'
                    ? 'bg-nasa-blue text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Burned Area Model Estimate (Ha)
              </button>
              <button
                onClick={() => setSelectedMetric('detections')}
                className={`py-1 px-2 rounded-lg text-center transition-all font-mono text-[11px] ${
                  selectedMetric === 'detections'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Effective Detections (N_eff)
              </button>
            </div>
          </div>

        </div>

        {/* Key Monthly Scientific Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Available Feed Days</span>
            <span className="text-white font-bold text-sm">
              {summary.activeDaysMonitored ?? 0} / {summary.totalDaysInMonth ?? 31} Days
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Discrete overpasses (2–4/d)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Harmonized FRP</span>
            <span className="text-amber-400 font-bold text-sm">
              {summary.totalHarmonizedFrpMw ? `${Math.round(summary.totalHarmonizedFrpMw).toLocaleString()} MW` : '0 MW'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Avg: {summary.meanDailyHarmonizedFrpMw ? `${summary.meanDailyHarmonizedFrpMw.toLocaleString()} MW/d` : '0'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Burned Area (Model Estimate)</span>
            <span className="text-fire-400 font-bold text-sm">
              {summary.totalEstimatedBurnedAreaHa ? `${Math.round(summary.totalEstimatedBurnedAreaHa).toLocaleString()} Ha` : '0 Ha'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Wooster FRE Model Proxy</span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Effective Detections</span>
            <span className="text-cyan-400 font-bold text-sm">
              {summary.totalEffectiveIndependentDetections ? summary.totalEffectiveIndependentDetections.toLocaleString() : '0'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">N_eff non-duplicated</span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Peak Burning Day</span>
            <span className="text-nasa-gold font-bold text-sm">
              {summary.peakBurningDay?.date ? summary.peakBurningDay.date.slice(5) : '—'}
            </span>
            <span className="text-[10px] text-amber-300 block mt-0.5">
              {summary.peakBurningDay ? `${Math.round(summary.peakBurningDay.harmonizedFrp).toLocaleString()} MW` : '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Sensor Dominance</span>
            <span className="text-purple-300 font-bold text-xs truncate block" title={summary.dominantSensor}>
              {summary.dominantSensor || 'Dual Balanced'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Consistency: {summary.crossSensorConsistencyIndex ? `${(summary.crossSensorConsistencyIndex * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Critical Scientific Guardrail Notice */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200/90 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center space-x-2">
            <span>SCIENTIFIC PRINCIPLE: HOTSPOT PIXEL DETECTIONS ≠ CONFIRMED WILDFIRE COUNTS</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hotspots represent instantaneous sensor thermal anomaly flags triggered at satellite overpass. 
            Because <strong>MODIS (1,000m)</strong> and <strong>VIIRS (375m)</strong> possess radically different spatial resolutions and overpass schedules, 
            their raw hotspot counts <strong className="text-amber-300">must never be directly summed together</strong>. 
            This calendar displays the cross-sensor calibrated <strong>Harmonized Activity Metric</strong> and effective independent burning counts (N_eff).
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            activeTab === 'calendar'
              ? 'bg-space-900 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-fire-500" />
          <span>Interactive Calendar & Day Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('seasonality')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            activeTab === 'seasonality'
              ? 'bg-space-900 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-nasa-cyan" />
          <span>Seasonal Baseline & Anomaly Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            activeTab === 'methodology'
              ? 'bg-space-900 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Info className="w-4 h-4 text-nasa-gold" />
          <span>Harmonization Guardrails & Model Specs</span>
        </button>
      </div>

      {/* 4. Tab 1: Calendar Grid & Day Inspector */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          
          {/* Calendar Heatmap & Day Inspector 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: 7-Column Month Calendar Grid (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-fire-500" />
                    <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear} Heatmap</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any day cell to inspect detailed observation telemetry
                  </p>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                  <span>Level:</span>
                  <span className="w-2.5 h-2.5 rounded bg-space-900 border border-slate-700" title="Zero / No Data" />
                  <span className="w-2.5 h-2.5 rounded bg-emerald-700" title="Low Activity" />
                  <span className="w-2.5 h-2.5 rounded bg-amber-600" title="Moderate Activity" />
                  <span className="w-2.5 h-2.5 rounded bg-orange-500" title="High Activity" />
                  <span className="w-2.5 h-2.5 rounded bg-red-600" title="Extreme Activity" />
                </div>
              </div>

              {/* Calendar Days Table Grid */}
              <div className="w-full">
                
                {/* Weekday Header */}
                <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-800">
                  {WEEKDAY_NAMES.map((w) => (
                    <div key={w} className="py-1">{w}</div>
                  ))}
                </div>

                {/* Day Cells Grid */}
                {loading ? (
                  <div className="py-24 text-center space-y-3 font-mono text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 text-fire-500 animate-spin mx-auto" />
                    <p>Aggregating NASA MODIS & VIIRS observations from PostgreSQL...</p>
                  </div>
                ) : error ? (
                  <div className="py-16 text-center space-y-2 font-mono text-xs text-red-400">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                    <p>{error}</p>
                    <button
                      onClick={loadCalendar}
                      className="px-3 py-1.5 rounded-lg bg-fire-600 text-white hover:bg-fire-500 mt-2 text-xs font-mono"
                    >
                      Retry Query
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5 pt-2">
                    
                    {/* Padding cells for days before the 1st of the month */}
                    {calendarDays.length > 0 && Array.from({ length: calendarDays[0].dayOfWeek }).map((_, pIdx) => (
                      <div
                        key={`pad-${pIdx}`}
                        className="h-20 sm:h-24 rounded-xl bg-space-950/20 border border-dashed border-slate-800/40 p-1 opacity-25 pointer-events-none"
                      />
                    ))}

                    {/* Actual Calendar Days */}
                    {calendarDays.map((dayObj) => {
                      const isSelected = selectedDay && selectedDay.date === dayObj.date;
                      const hasData = dayObj.hasData;
                      const isPeak = summary.peakBurningDay?.date === dayObj.date;

                      let metricDisplay = '—';
                      if (hasData) {
                        if (selectedMetric === 'frp') {
                          metricDisplay = `${Math.round(dayObj.frpSummaries?.harmonizedActivityFrpMw || 0).toLocaleString()} MW`;
                        } else if (selectedMetric === 'burned_area') {
                          metricDisplay = `${Math.round(dayObj.burnedAreaEst?.nominalHa || 0).toLocaleString()} Ha`;
                        } else {
                          metricDisplay = `${(dayObj.observationCounts?.effectiveIndependentDetections || 0).toLocaleString()} obs`;
                        }
                      }

                      return (
                        <div
                          key={dayObj.date}
                          onClick={() => setSelectedDay(dayObj)}
                          className={`relative h-20 sm:h-24 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between cursor-pointer transition-all ${getActivityColorClasses(
                            dayObj.activityLevel,
                            isSelected
                          )}`}
                          title={`Date: ${dayObj.date}\nActivity: ${dayObj.activityLevel}\nHarmonized FRP: ${dayObj.frpSummaries?.harmonizedActivityFrpMw} MW\nMODIS: ${dayObj.observationCounts?.modisDetectionCount}\nVIIRS: ${dayObj.observationCounts?.viirsDetectionCount}\nEffective Detections: ${dayObj.observationCounts?.effectiveIndependentDetections}`}
                        >
                          {/* Top Row: Day number & Overpass indicator */}
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-xs font-bold ${hasData ? 'text-white' : 'text-slate-600'}`}>
                              {dayObj.day}
                            </span>

                            {hasData ? (
                              <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                                dayObj.dataAvailability === 'DUAL_SENSOR_OVERPASS'
                                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                  : dayObj.dataAvailability === 'VIIRS_ONLY_OVERPASS'
                                  ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                                  : 'bg-orange-950/80 text-orange-300 border border-orange-800/60'
                              }`}>
                                {dayObj.dataAvailability === 'DUAL_SENSOR_OVERPASS' ? 'Dual' : dayObj.dataAvailability === 'VIIRS_ONLY_OVERPASS' ? 'VIIRS' : 'MODIS'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-slate-700">gap</span>
                            )}
                          </div>

                          {/* Center: Metric value */}
                          <div className="my-auto text-center">
                            {hasData ? (
                              <div className="font-mono text-[11px] sm:text-xs font-bold truncate">
                                {metricDisplay}
                              </div>
                            ) : (
                              <div className="text-[9px] font-mono text-slate-600 italic">No pass</div>
                            )}
                          </div>

                          {/* Bottom Row: Hotspot counts & Anomaly Marker */}
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            {hasData ? (
                              <>
                                <span className="text-slate-400">
                                  M:{dayObj.observationCounts?.modisDetectionCount} V:{dayObj.observationCounts?.viirsDetectionCount}
                                </span>
                                {dayObj.anomalyStatus === 'ANOMALOUS_HIGH' && (
                                  <span className="text-red-400 font-bold" title="Anomalous Fire Activity (>= +2 sigma baseline)">
                                    +2σ
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </div>

                          {/* Peak Day Crown Badge */}
                          {isPeak && (
                            <div className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-nasa-gold text-space-950 text-[8px] font-bold uppercase shadow">
                              Peak
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                )}

              </div>

              {/* Calendar Footer Info */}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Color scale reflects combined Harmonized Fire Radiative Power (MW).</span>
                <span className="font-mono text-slate-500">Dual = Aqua/Terra + SNPP/NOAA-20/21</span>
              </div>
            </div>

            {/* Right Column: Detailed Day Observation Inspector Panel (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-fire-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Observation Inspector</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {selectedDay ? selectedDay.date : 'No date selected'}
                    </p>
                  </div>
                </div>

                {selectedDay?.hasData ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    selectedDay.anomalyStatus === 'ANOMALOUS_HIGH'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : selectedDay.anomalyStatus === 'ELEVATED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {selectedDay.anomalyStatus}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                    NO OVERPASS
                  </span>
                )}
              </div>

              {selectedDay && selectedDay.hasData ? (
                <div className="space-y-4">
                  
                  {/* Harmonized FRP & Effective Count Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block text-[10px]">Harmonized Daily FRP</span>
                      <span className="text-lg font-bold text-amber-400">
                        {Math.round(selectedDay.frpSummaries?.harmonizedActivityFrpMw || 0).toLocaleString()} MW
                      </span>
                      <span className="text-[10px] text-slate-500 block">Radiant Heat Output</span>
                    </div>

                    <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block text-[10px]">Effective Detections (N_eff)</span>
                      <span className="text-lg font-bold text-cyan-400">
                        {selectedDay.observationCounts?.effectiveIndependentDetections?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Non-coincident events</span>
                    </div>
                  </div>

                  {/* Sensor Breakdown: MODIS vs VIIRS vs Matched */}
                  <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Sensor Deconfliction Breakdown</span>
                      <span className="text-[10px] text-slate-500">Stage 3 Matcher</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-space-900 border border-slate-800">
                        <span className="text-[10px] text-orange-400 block">MODIS (1km)</span>
                        <span className="text-sm font-bold text-white">
                          {selectedDay.observationCounts?.modisDetectionCount}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {Math.round(selectedDay.frpSummaries?.modisFrpMw?.sum || 0)} MW
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-space-900 border border-slate-800">
                        <span className="text-[10px] text-red-400 block">VIIRS (375m)</span>
                        <span className="text-sm font-bold text-white">
                          {selectedDay.observationCounts?.viirsDetectionCount}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {Math.round(selectedDay.frpSummaries?.viirsFrpMw?.sum || 0)} MW
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-space-900 border border-slate-800">
                        <span className="text-[10px] text-cyan-400 block">Matched Pairs</span>
                        <span className="text-sm font-bold text-nasa-cyan">
                          {selectedDay.observationCounts?.matchedObservationGroups ?? 0}
                        </span>
                        <span className="text-[9px] text-slate-400 block">Coincident</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 leading-normal">
                      Raw uncalibrated sum: <strong className="text-slate-300">{selectedDay.observationCounts?.uncalibratedRawSumDO_NOT_USE_AS_FIRE_COUNT}</strong> (Warning: Never treat raw sum as verified fires).
                    </p>
                  </div>

                  {/* Physical Burned Area Estimate Card */}
                  <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-1.5 text-xs font-mono">
                    <span className="text-slate-400 block text-[10px]">Burned Area Model Estimate (Wooster FRE Formulation)</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-fire-400">
                        {Math.round(selectedDay.burnedAreaEst?.nominalHa || 0).toLocaleString()} Ha (Model Estimate)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({Math.round(selectedDay.burnedAreaEst?.lowerBoundHa || 0).toLocaleString()} – {Math.round(selectedDay.burnedAreaEst?.upperBoundHa || 0).toLocaleString()} Ha range)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      FRE proxy conversion; not directly observed burn scars. Active Cells: {selectedDay.observationCounts?.uniqueGridCells} (1 km²)
                    </span>
                  </div>

                  {/* Raw Individual Observations Table (Sample from Database) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center space-x-1">
                        <Satellite className="w-3.5 h-3.5 text-nasa-cyan" />
                        <span>NASA FIRMS Observations Sample</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {dayObservations.length} records shown
                      </span>
                    </div>

                    {loadingObservations ? (
                      <div className="py-6 text-center text-xs font-mono text-slate-400">
                        <RefreshCw className="w-4 h-4 text-fire-500 animate-spin mx-auto mb-1" />
                        Fetching day observations from database...
                      </div>
                    ) : observationError ? (
                      <div className="p-3 rounded-xl bg-red-950/40 text-red-400 text-xs font-mono">
                        {observationError}
                      </div>
                    ) : dayObservations.length === 0 ? (
                      <div className="p-4 rounded-xl bg-space-950 text-slate-500 text-xs font-mono text-center">
                        No individual records returned for this date and bounding box.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-space-950">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-space-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                            <tr>
                              <th className="py-1.5 px-2.5">Sensor</th>
                              <th className="py-1.5 px-2">Sat</th>
                              <th className="py-1.5 px-2">Coords</th>
                              <th className="py-1.5 px-2">Time (UTC)</th>
                              <th className="py-1.5 px-2 text-right">FRP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {dayObservations.slice(0, 30).map((obs) => (
                              <tr key={obs.id} className="hover:bg-space-800/50">
                                <td className="py-1.5 px-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    obs.sensor === 'MODIS' ? 'bg-orange-950 text-orange-400' : 'bg-red-950 text-red-400'
                                  }`}>
                                    {obs.sensor}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-slate-400">{obs.satellite}</td>
                                <td className="py-1.5 px-2 text-[10px]">
                                  {parseFloat(obs.latitude).toFixed(2)}°, {parseFloat(obs.longitude).toFixed(2)}°
                                </td>
                                <td className="py-1.5 px-2 text-slate-400">{obs.acq_time}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-amber-300">
                                  {parseFloat(obs.frp_mw).toFixed(1)} MW
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="py-16 text-center space-y-3 font-mono text-xs text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-space-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
                      STATUS: NO_OBSERVATIONS
                    </span>
                    <p className="text-slate-400 font-semibold pt-1">No satellite fire detections recorded for this calendar date.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Dates outside the active NASA FIRMS ingestion window (Oct 26 – Nov 3, 2026), or obscured by persistent cloud cover, yield zero observations.
                      Polar-orbiting satellites provide discrete snapshot sampling (2–4 passes/day), not continuous 24-hour monitoring.
                    </p>
                  </div>
                  <p className="text-[10px] text-fire-400/80 pt-1">Select an active overpass day (highlighted with color) in the calendar grid.</p>
                </div>
              )}

            </div>

          </div>

          {/* Multi-Sensor Daily Time-Series Plotly Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-nasa-cyan" />
                <span>Multi-Sensor Daily Activity Sequence ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">Click any bar to inspect day</span>
            </div>

            <div className="w-full h-72 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
              {activeDaysForPlot.length === 0 ? (
                <div className="h-full flex items-center justify-center font-mono text-xs text-slate-500">
                  No active observation data available for this selected month and region.
                </div>
              ) : selectedMetric === 'frp' ? (
                <Plot
                  data={[
                    {
                      x: plotDates,
                      y: plotModisFrp,
                      name: 'MODIS FRP (MW)',
                      type: 'bar',
                      marker: { color: 'rgba(251, 146, 60, 0.7)' },
                    },
                    {
                      x: plotDates,
                      y: plotViirsFrp,
                      name: 'VIIRS FRP (MW)',
                      type: 'bar',
                      marker: { color: 'rgba(239, 68, 68, 0.75)' },
                    },
                    {
                      x: plotDates,
                      y: plotHarmonizedFrp,
                      name: 'Harmonized Activity Curve',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#00e5ff', width: 2.5, shape: 'spline' },
                      marker: { size: 6, color: '#fdb813' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    barmode: 'group',
                    margin: { l: 45, r: 25, t: 25, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    legend: {
                      orientation: 'h',
                      y: 1.15,
                      x: 0,
                      font: { color: '#94a3b8', size: 10 },
                    },
                    xaxis: {
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                    yaxis: {
                      title: { text: 'FRP (MW)', font: { size: 10, color: '#94a3b8' } },
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                  onClick={(data) => {
                    if (data.points && data.points.length > 0) {
                      const clickedDate = data.points[0].x;
                      const found = calendarDays.find((d) => d.date === clickedDate);
                      if (found) setSelectedDay(found);
                    }
                  }}
                />
              ) : selectedMetric === 'burned_area' ? (
                <Plot
                  data={[
                    {
                      x: plotDates,
                      y: plotBurnedArea,
                      name: 'Estimated Burned Area (Ha)',
                      type: 'bar',
                      marker: { color: 'rgba(249, 115, 22, 0.85)' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 25, t: 25, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    legend: { font: { color: '#94a3b8', size: 10 } },
                    xaxis: {
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                    yaxis: {
                      title: { text: 'Burned Area (Hectares)', font: { size: 10, color: '#94a3b8' } },
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                  onClick={(data) => {
                    if (data.points && data.points.length > 0) {
                      const clickedDate = data.points[0].x;
                      const found = calendarDays.find((d) => d.date === clickedDate);
                      if (found) setSelectedDay(found);
                    }
                  }}
                />
              ) : (
                <Plot
                  data={[
                    {
                      x: plotDates,
                      y: plotEffectiveCount,
                      name: 'Effective Detections (Neff)',
                      type: 'bar',
                      marker: { color: 'rgba(16, 185, 129, 0.85)' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 25, t: 25, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    legend: { font: { color: '#94a3b8', size: 10 } },
                    xaxis: {
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                    yaxis: {
                      title: { text: 'Effective Detections', font: { size: 10, color: '#94a3b8' } },
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 10 },
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                  onClick={(data) => {
                    if (data.points && data.points.length > 0) {
                      const clickedDate = data.points[0].x;
                      const found = calendarDays.find((d) => d.date === clickedDate);
                      if (found) setSelectedDay(found);
                    }
                  }}
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* 5. Tab 2: Seasonal Baseline & Historical Analysis */}
      {activeTab === 'seasonality' && (
        <div className="space-y-6">
          
          {/* Seasonal Analysis Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-fire-400 font-bold uppercase tracking-wider block">
                  Current Climatological Regime
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {seasonal.currentSeasonName || 'Post-Monsoon Kharif Season'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Focus: <strong className="text-slate-200">{seasonal.regionalFocus}</strong> • Biomass: {seasonal.primaryBiomassType}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-950 border border-slate-800 font-mono text-xs text-right">
                <span className="text-slate-400 block text-[10px]">Deviation vs Climatology</span>
                <span className={`text-base font-bold ${
                  seasonal.climatologicalBaseline?.seasonalDeviationPct > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {seasonal.climatologicalBaseline?.seasonalDeviationPct > 0 ? '+' : ''}
                  {seasonal.climatologicalBaseline?.seasonalDeviationPct ?? 0}%
                </span>
                <span className="text-[10px] text-slate-500 block">Relative to 5-yr Baseline</span>
              </div>
            </div>

            {/* 4 Indian Fire Seasons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {(seasonal.seasons || []).map((s, idx) => {
                const isCurrent = idx === 0;
                return (
                  <div
                    key={s.name}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                      isCurrent
                        ? 'bg-fire-950/30 border-fire-500/50 text-white shadow-sm'
                        : 'bg-space-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{s.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-space-900 border border-slate-700 text-slate-300">
                        {s.annualSharePct}% Ann.
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-amber-300">
                      {s.months}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {s.keyDrivers}
                    </p>

                    <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                      Sensors: {s.activeSensors}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Annual Month-by-Month Baseline Distribution */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-nasa-cyan" />
                <h3 className="text-sm font-bold text-white">Annual Month-by-Month Climatological Baseline for India</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Published Remote Sensing Literature Baseline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {monthlyPattern.map((m) => {
                const isPeak = m.month === 'Oct' || m.month === 'Nov' || m.month === 'Mar' || m.month === 'Apr';
                const isCurrentMonth = m.month === MONTH_NAMES[selectedMonth - 1]?.slice(0, 3);
                return (
                  <div
                    key={m.month}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrentMonth
                        ? 'bg-fire-600/20 border-fire-500 ring-2 ring-fire-500/50 text-white'
                        : isPeak
                        ? 'bg-space-900/80 border-slate-700 text-slate-200'
                        : 'bg-space-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span>{m.month}</span>
                      <span className={`text-[10px] ${isPeak ? 'text-amber-400' : 'text-slate-500'}`}>
                        {m.share}
                      </span>
                    </div>

                    <div className="text-sm font-bold mt-1 text-slate-100 font-mono">
                      {Math.round(m.baselineFrp / 1000)}k MW
                    </div>

                    <p className="text-[9px] text-slate-400 leading-tight mt-1 line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1">
              <strong className="text-slate-200 block">Baseline Statistical Anomaly Methodology:</strong>
              <p className="text-[11px]">
                In accordance with FIRMS active fire validation standards, daily observations are evaluated against the monthly climatological baseline (mean μ, standard deviation σ).
                Detections with Z ≥ +2.0 are classified as <strong className="text-red-400">Anomalously High</strong>, reflecting concentrated episodic combustion. 
                These are treated as thermal anomaly surges rather than confirmed disaster wildfires.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 6. Tab 3: Harmonization Methodology & Scientific Guardrails */}
      {activeTab === 'methodology' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-5 h-5 text-nasa-gold" />
            <h3 className="text-sm font-bold text-white">Scientific Principles & Harmonization Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>1. Non-Additivity of MODIS & VIIRS Counts</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                A single physical fire covering a few hundred square meters can trigger one 1,000m MODIS pixel while triggering multiple 375m VIIRS pixels due to pixel resolution disparity (~7.1x higher spatial resolution for VIIRS). 
                Directly adding MODIS and VIIRS hotspot counts generates inflated, scientifically invalid fire frequencies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-nasa-cyan flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-nasa-cyan" />
                <span>2. Effective Independent Detections (N_eff)</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                FireSync Stage 3 applies mutual bipartite nearest-neighbor matching across a configurable time window (≤ 60 min) and equal-area distance threshold (≤ 1,500 m). 
                Coincident pairs are merged into a single event, while non-coincident detections are preserved:
                <span className="block font-mono text-cyan-300 my-1 font-bold">N_eff = N_matched + N_MODIS_only + N_VIIRS_only</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-fire-400 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-fire-400" />
                <span>3. Wooster Biomass FRE Conversion</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Burned area is calculated using the Wooster et al. (2005) Fire Radiative Energy formulation:
                <span className="block font-mono text-amber-300 my-0.5">FRE (MJ) = FRP (MW) × Duration (6h) × 3600</span>
                <span className="block font-mono text-amber-300 my-0.5">Biomass Consumed (kg) = FRE × 0.368 kg/MJ</span>
                Nominal burned area assumes 25 tons/ha fuel density, with uncertainty bounds between 15 tons/ha (sparse) and 45 tons/ha (dense fuel).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>4. Satellite Overpass Continuity</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Over India, Aqua (MODIS) and Suomi-NPP / NOAA-20 (VIIRS) afternoon overpasses occur between 08:30 and 11:00 UTC, while Terra (MODIS) passes at ~04:00 UTC. 
                Days with single-sensor detections occur when cloud cover or orbital coverage gaps obscure one sensor, documented via the <strong>Data Availability</strong> flag.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
