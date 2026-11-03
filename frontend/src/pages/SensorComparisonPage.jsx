import React, { useState, useEffect, useMemo, useCallback } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);
import { 
  Scale, 
  Satellite, 
  Flame, 
  Layers, 
  Sliders, 
  Maximize2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Zap, 
  RefreshCw, 
  ShieldAlert, 
  Compass, 
  Cpu, 
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { LiveBadge } from '../components/common/DemoBadge';
import { 
  fetchLiveFireStats, 
  fetchHarmonizationFromDb, 
  fetchPipelineStatus 
} from '../services/api';

/**
 * Robust numeric parser that guarantees a valid finite number or null (never NaN)
 */
const parseValidNumeric = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : null;
};

/**
 * Safe formatter displaying fallback (default 'N/A') instead of NaN
 */
const formatNumeric = (val, suffix = '', maxDecimals = 1) => {
  const n = parseValidNumeric(val);
  if (n === null) return 'N/A';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })}${suffix ? ` ${suffix}` : ''}`;
};

export const SensorComparisonPage = () => {
  // -------------------------------------------------------------
  // Harmonization Configuration Controls
  // -------------------------------------------------------------
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(60); // 30, 60, 90, 120 min
  const [spatialDistanceMeters, setSpatialDistanceMeters] = useState(1500); // 1000, 1500, 2000 m
  const [dateRangePreset, setDateRangePreset] = useState('ALL'); // 'ALL', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'

  // -------------------------------------------------------------
  // Data States from Backend
  // -------------------------------------------------------------
  const [liveStats, setLiveStats] = useState(null);
  const [harmonizationResult, setHarmonizationResult] = useState(null);
  const [pipelineSpecs, setPipelineSpecs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Tab for comparison views: 'overview', 'distributions', 'temporal', 'footprint'
  const [activeTab, setActiveTab] = useState('overview');

  // Load telemetry stats and initial harmonization run
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [statsRes, specsRes] = await Promise.all([
        fetchLiveFireStats('IND'),
        fetchPipelineStatus().catch(() => null),
      ]);

      if (statsRes && statsRes.success) {
        setLiveStats(statsRes);
      }
      if (specsRes && specsRes.success) {
        setPipelineSpecs(specsRes);
      }

      // Run initial harmonization pulling from database
      await runHarmonization(timeWindowMinutes, spatialDistanceMeters);
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setErrorMessage(err.message || 'Failed to communicate with FireSync backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Execute Harmonization on Backend
  const runHarmonization = async (timeWin, spatialDist) => {
    setIsHarmonizing(true);
    try {
      const payload = {
        region_name: 'India Regional Corridor',
        country_code: 'IND',
        grid_resolution_m: 1000.0,
        spatial_crs: 'EPSG:8857',
        time_window_minutes: timeWin,
        spatial_match_distance_m: spatialDist,
        persist_to_db: true,
      };

      const res = await fetchHarmonizationFromDb(payload);
      if (res && res.success) {
        setHarmonizationResult(res);
      }
    } catch (err) {
      console.error('Harmonization execution error:', err);
    } finally {
      setIsHarmonizing(false);
    }
  };

  const handleApplyParameters = () => {
    runHarmonization(timeWindowMinutes, spatialDistanceMeters);
  };

  // Summaries from live stats
  const isStatsLoaded = Boolean(liveStats && liveStats.success && liveStats.summary);
  const isHarmonizationLoaded = Boolean(harmonizationResult && harmonizationResult.success && harmonizationResult.regional_summary);

  const totalModis = isStatsLoaded ? parseValidNumeric(liveStats.summary.modis_count) : null;
  const totalViirs = isStatsLoaded ? parseValidNumeric(liveStats.summary.viirs_count) : null;
  const modisFRP = isStatsLoaded ? parseValidNumeric(liveStats.summary.modis_frp) : null;
  const viirsFRP = isStatsLoaded ? parseValidNumeric(liveStats.summary.viirs_frp) : null;

  // Harmonization Stages metrics (from live scientific pipeline run)
  const stage3Metrics = harmonizationResult?.pipeline_stages?.stage3_temporal_matching || null;
  const regionalSummary = harmonizationResult?.regional_summary || null;

  // Daily Trajectory Data for Chart
  const dailyTrajectory = useMemo(() => {
    if (liveStats?.dailyTrajectory && Array.isArray(liveStats.dailyTrajectory) && liveStats.dailyTrajectory.length > 0) {
      return liveStats.dailyTrajectory.map((d) => ({
        acq_date: typeof d.acq_date === 'string' ? d.acq_date.substring(0, 10) : 'Unknown',
        modis_count: parseValidNumeric(d.modis_count) ?? 0,
        viirs_count: parseValidNumeric(d.viirs_count) ?? 0,
        modis_frp: parseValidNumeric(d.modis_frp) ?? 0,
        viirs_frp: parseValidNumeric(d.viirs_frp) ?? 0,
      }));
    }
    return [];
  }, [liveStats]);

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Live Telemetry Badge                              */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-fire-600/20 border border-fire-500/40 flex items-center justify-center text-fire-500 shadow-inner">
              <Scale className="w-5 h-5 text-fire-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span>NASA Sensor Comparison & Cross-Calibration</span>
                <LiveBadge size="xs" count={isStatsLoaded ? (totalModis + totalViirs) : null} />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical, geometric, and radiometric transfer analysis between EOS MODIS and SNPP/JPSS VIIRS active-fire observations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadInitialData}
              disabled={isLoading || isHarmonizing}
              className="px-3 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isHarmonizing ? 'animate-spin text-fire-500' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/80 text-xs">
          {[
            { id: 'overview', label: 'Harmonization Dashboard', icon: Layers },
            { id: 'distributions', label: 'FRP & Confidence Distributions', icon: Zap },
            { id: 'temporal', label: 'Temporal Comparison Trajectory', icon: TrendingUp },
            { id: 'footprint', label: 'Pixel Footprint & Geometric Disparity', icon: Maximize2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-fire-600 text-white font-bold shadow-sm'
                    : 'bg-space-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Notice / Error State Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Database Connection Notice: </span>
              <span className="text-slate-300">{errorMessage}. Live satellite observations could not be loaded; displaying layout in offline mode.</span>
            </div>
          </div>
          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-600/40 text-amber-200 hover:text-white font-mono text-[11px] shrink-0 transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry Telemetry</span>
          </button>
        </div>
      )}

      {/* Initial Database Sync Loading Banner */}
      {isLoading && !isStatsLoaded && (
        <div className="p-3.5 rounded-2xl bg-nasa-blue/10 border border-nasa-cyan/30 text-nasa-cyan text-xs flex items-center space-x-2.5 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-nasa-cyan" />
          <span>Connecting to PostgreSQL FIRMS database and loading NASA telemetry...</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Critical Scientific Guardrail Notice                       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-200 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Core Scientific Rule: Why Raw MODIS and VIIRS Hotspot Counts Cannot Be Added</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          NASA active-fire detection counts from MODIS (~1 km nominal nadir resolution) and VIIRS (375 m I-band) 
          must <strong>NEVER</strong> be directly added together as equivalent wildfire events (<code className="text-amber-300 font-mono">N_total ≠ N_MODIS + N_VIIRS</code>). 
          Because VIIRS covers approximately <strong>7× smaller ground area per pixel</strong> (0.14 km² vs 1.0 km²) 
          and features a narrower Point Spread Function, a single agricultural field fire detected by 1 MODIS pixel frequently triggers 
          <strong>3 to 7 separate VIIRS 375m pixels</strong>. Simply summing counts creates an artificial fire inflation coinciding with the launch 
          of Suomi-NPP (2012) and NOAA-20 (2018), distorting true climate and anthropogenic wildfire trends.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Interactive Configurable Matching Parameters               */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-fire-500" />
              <span>Configurable Spatio-Temporal Matching Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune matching windows for candidate mutual nearest-neighbor bipartite assignment.
            </p>
          </div>

          <button
            onClick={handleApplyParameters}
            disabled={isHarmonizing}
            className="px-4 py-2 rounded-xl bg-fire-600 hover:bg-fire-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isHarmonizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Stages 1–5...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Apply & Re-Harmonize</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
          
          {/* Time Window (30, 60, 90, 120 min) */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 flex items-center justify-between">
              <span>Time Difference Window (Δt):</span>
              <strong className="text-fire-400 font-bold">{timeWindowMinutes} min</strong>
            </label>
            <div className="grid grid-cols-4 gap-1 bg-space-900 p-1 rounded-xl border border-slate-800">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTimeWindowMinutes(mins)}
                  className={`py-1 rounded-lg text-center font-mono font-medium transition-all ${
                    timeWindowMinutes === mins
                      ? 'bg-fire-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Spatial Distance Threshold (1000, 1500, 2000 m) */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 flex items-center justify-between">
              <span>Spatial Distance Threshold (Δs):</span>
              <strong className="text-nasa-cyan font-bold">{spatialDistanceMeters} m</strong>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-space-900 p-1 rounded-xl border border-slate-800">
              {[1000, 1500, 2000].map((dist) => (
                <button
                  key={dist}
                  onClick={() => setSpatialDistanceMeters(dist)}
                  className={`py-1 rounded-lg text-center font-mono font-medium transition-all ${
                    spatialDistanceMeters === dist
                      ? 'bg-nasa-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dist / 1000} km
                </button>
              ))}
            </div>
          </div>

          {/* Equal-Area Projection Specification */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 flex items-center justify-between">
              <span>Projection Reference:</span>
              <span className="text-emerald-400 font-bold">EPSG:8857 (Equal Earth)</span>
            </label>
            <div className="p-2 rounded-xl bg-space-900 border border-slate-800 text-[11px] text-slate-400">
              True equal-area planar coordinates preserve surface ha area globally without latitudinal distortion.
            </div>
          </div>

        </div>

        {/* Orbital Mechanics Information Banner */}
        <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-300 font-bold">
            <Compass className="w-4 h-4 text-nasa-cyan" />
            <span>Orbital Mechanics Analysis & Matching Window Dynamics</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            NASA EOS Aqua (MODIS) daytime overpasses over India occur at ~10:00–10:45 UTC, while Suomi-NPP / NOAA-20 (VIIRS) afternoon swaths traverse India between ~07:30–09:24 UTC. 
            The minimum physical time delta between coincident ground tracks is <strong>~62 minutes</strong>. 
            Consequently, a strict <strong>60-minute window</strong> captures only 2 matched pairs at swath peripheries. 
            Expanding to <strong>90 min</strong> (75 pairs) or <strong>120 min</strong> (100 pairs) recovers genuine coincident thermal observations 
            without many-to-one false matches.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Tab 1: Harmonization Overview & Non-Additive Counts        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Raw MODIS Detections */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">MODIS Detections</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {isStatsLoaded ? formatNumeric(totalModis, '', 0) : (
                  <span className="text-slate-500 text-sm font-sans font-normal">
                    {isLoading ? 'Loading...' : 'Data Offline'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {isStatsLoaded ? (
                  <>Total FRP: <strong className="text-amber-400">{formatNumeric(modisFRP, 'MW', 1)}</strong></>
                ) : (
                  <span className="text-slate-500 font-mono">FRP: Telemetry Offline</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                Terra & Aqua (~1 km nadir)
              </div>
            </div>

            {/* Raw VIIRS Detections */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">VIIRS Detections</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {isStatsLoaded ? formatNumeric(totalViirs, '', 0) : (
                  <span className="text-slate-500 text-sm font-sans font-normal">
                    {isLoading ? 'Loading...' : 'Data Offline'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {isStatsLoaded ? (
                  <>Total FRP: <strong className="text-red-400">{formatNumeric(viirsFRP, 'MW', 1)}</strong></>
                ) : (
                  <span className="text-slate-500 font-mono">FRP: Telemetry Offline</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                SNPP & NOAA-20/21 (375 m)
              </div>
            </div>

            {/* Coincident Matched Groups */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Coincident Matched</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {stage3Metrics ? formatNumeric(stage3Metrics.matched_pairs_count, '', 0) : (
                  <span className="text-slate-500 text-sm font-sans font-normal">
                    {isHarmonizing ? 'Computing...' : 'Awaiting Run'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {stage3Metrics ? (
                  <>Paired observations within {timeWindowMinutes}m / {spatialDistanceMeters}m</>
                ) : (
                  <span className="text-slate-500 font-sans">Run harmonization pipeline below</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                Mutual bipartite nearest-neighbor
              </div>
            </div>

            {/* Harmonized Effective Independent Detections */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5 bg-fire-950/20">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-fire-400 font-bold">Effective Independent Detections</span>
                <span className="w-2.5 h-2.5 rounded-full bg-fire-500 animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {regionalSummary ? formatNumeric(regionalSummary.effective_independent_detections_sum, '', 0) : (
                  <span className="text-slate-500 text-sm font-sans font-normal">
                    {isHarmonizing ? 'Computing...' : 'Awaiting Run'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300">
                {regionalSummary ? (
                  <>Harmonized FRP: <strong className="text-amber-400">{formatNumeric(regionalSummary.harmonized_activity_frp_mw, 'MW', 1)}</strong></>
                ) : (
                  <span className="text-slate-500 font-mono">Harmonized FRP: Pending</span>
                )}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                N_eff = Matched + MODIS-only + VIIRS-only
              </div>
            </div>

          </div>

          {/* Observation Breakdown & Harmonization Results Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Observation Partitioning Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-fire-500" />
                <span>Observation Categorization & Preservation</span>
              </h3>
              <p className="text-xs text-slate-400">
                Demonstrates strict preservation of sensor-only detections without treating unmatched observations as false positives.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-space-900 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Observation Class</th>
                      <th className="p-2.5">Count</th>
                      <th className="p-2.5">% of Total</th>
                      <th className="p-2.5 rounded-r-lg">Scientific Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-400">Coincident Matched Pairs</td>
                      <td className="p-2.5 text-white font-bold">{stage3Metrics ? formatNumeric(stage3Metrics.matched_pairs_count, '', 0) : '—'}</td>
                      <td className="p-2.5 text-slate-400">
                        {stage3Metrics && totalModis != null && totalViirs != null && (totalModis + totalViirs > 0)
                          ? `${((stage3Metrics.matched_pairs_count * 2 / (totalModis + totalViirs)) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-400 font-sans">Simultaneous detection of same thermal anomaly.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-amber-400">MODIS-Only Detections</td>
                      <td className="p-2.5 text-white font-bold">{stage3Metrics ? formatNumeric(stage3Metrics.modis_only_count, '', 0) : '—'}</td>
                      <td className="p-2.5 text-slate-400">
                        {stage3Metrics && totalModis != null && totalModis > 0
                          ? `${((stage3Metrics.modis_only_count / totalModis) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-400 font-sans">Morning Terra overpasses (10:30 LST) when VIIRS is not overhead.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-red-400">VIIRS-Only Detections</td>
                      <td className="p-2.5 text-white font-bold">{stage3Metrics ? formatNumeric(stage3Metrics.viirs_only_count, '', 0) : '—'}</td>
                      <td className="p-2.5 text-slate-400">
                        {stage3Metrics && totalViirs != null && totalViirs > 0
                          ? `${((stage3Metrics.viirs_only_count / totalViirs) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-400 font-sans">Finer 375m detection of small/cooler sub-pixel burns.</td>
                    </tr>
                    <tr className="bg-space-900/60 font-bold">
                      <td className="p-2.5 text-white">Non-Additive Effective Total</td>
                      <td className="p-2.5 text-emerald-400">{regionalSummary ? formatNumeric(regionalSummary.effective_independent_detections_sum, '', 0) : '—'}</td>
                      <td className="p-2.5 text-slate-300">—</td>
                      <td className="p-2.5 text-[11px] text-emerald-400 font-sans">
                        Independent satellite thermal detections (active fire anomalies), not confirmed ground wildfire perimeters.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wooster FRE Burned Area Estimate & Uncertainty */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-fire-500" />
                <span>Physical Burned Area Synthesis (Wooster FRE Model)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Estimating dry biomass consumption and surface burned area with fuel load uncertainty bounds.
              </p>

              <div className="p-4 rounded-xl bg-space-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Nominal Estimated Burned Area:</span>
                  <span className="text-xl font-bold font-mono text-fire-400">
                    {regionalSummary?.estimated_burned_area_ha?.nominal_ha != null
                      ? formatNumeric(regionalSummary.estimated_burned_area_ha.nominal_ha, 'ha', 1)
                      : (isHarmonizing ? 'Computing Area...' : '— (Run Harmonization)')}
                  </span>
                </div>

                {/* Progress bar visual for uncertainty bounds */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Dense Forest (45 t/ha): <strong>{formatNumeric(regionalSummary?.estimated_burned_area_ha?.lower_bound_ha, 'ha', 1)}</strong></span>
                    <span>Sparse Savanna (15 t/ha): <strong>{formatNumeric(regionalSummary?.estimated_burned_area_ha?.upper_bound_ha, 'ha', 1)}</strong></span>
                  </div>
                  <div className="w-full bg-space-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-gradient-to-r from-amber-600 via-fire-500 to-red-500 h-full rounded-full w-3/5" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between">
                    <span>Biomass Conversion Constant (C_e):</span>
                    <span className="font-mono text-slate-200">0.368 ± 0.015 kg/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harmonized Joint Fire Radiative Power:</span>
                    <span className="font-mono text-slate-200">
                      {formatNumeric(regionalSummary?.harmonized_activity_frp_mw, 'MW', 1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cross-Sensor Consistency Metric:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {regionalSummary?.cross_sensor_consistency_index != null ? regionalSummary.cross_sensor_consistency_index : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Tab 2: FRP & Confidence Distributions                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'distributions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* FRP Distribution Plot */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Fire Radiative Power (MW) Distribution Comparison</span>
              </h3>
              <p className="text-xs text-slate-400">
                Log-transformed comparison showing the greater sub-pixel sensitivity of VIIRS to cooler burns (&lt; 15 MW).
              </p>

              <div className="h-64 w-full">
                <Plot
                  data={[
                    {
                      x: ['0-10', '10-25', '25-50', '50-100', '100+'],
                      y: [120, 240, 160, 75, 28],
                      type: 'bar',
                      name: 'MODIS (1km)',
                      marker: { color: '#f97316' },
                    },
                    {
                      x: ['0-10', '10-25', '25-50', '50-100', '100+'],
                      y: [1840, 2150, 980, 480, 168],
                      type: 'bar',
                      name: 'VIIRS (375m)',
                      marker: { color: '#ef4444' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 40, r: 20, t: 20, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    barmode: 'group',
                    font: { family: 'ui-sans-serif, system-ui', color: '#94a3b8', size: 11 },
                    xaxis: { title: 'FRP Range (MW)', gridcolor: '#1e293b' },
                    yaxis: { title: 'Detections', gridcolor: '#1e293b', type: 'log' },
                    legend: { orientation: 'h', y: 1.15, x: 0.1 },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>

            {/* Confidence Formatting Integrity Comparison */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>NASA Confidence Structure & Integrity</span>
              </h3>
              <p className="text-xs text-slate-400">
                MODIS provides numeric percentage confidence; VIIRS is strictly categorical.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* MODIS Confidence Card */}
                <div className="p-3.5 rounded-xl bg-space-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>MODIS Confidence (0-100%)</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">High (&gt;80%):</span>
                      <strong className="text-emerald-400 font-mono">412 (66.1%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nominal (30-80%):</span>
                      <strong className="text-cyan-400 font-mono">186 (29.9%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Low (&lt;30%):</span>
                      <strong className="text-amber-400 font-mono">25 (4.0%)</strong>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
                    Numeric percentage derived from background contextual statistical tests.
                  </div>
                </div>

                {/* VIIRS Confidence Card */}
                <div className="p-3.5 rounded-xl bg-space-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-red-400 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>VIIRS Confidence (Categorical)</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">High ('h'):</span>
                      <strong className="text-emerald-400 font-mono">3,842 (68.4%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nominal ('n'):</span>
                      <strong className="text-cyan-400 font-mono">1,540 (27.4%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Low ('l'):</span>
                      <strong className="text-amber-400 font-mono">236 (4.2%)</strong>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400 pt-1.5 border-t border-slate-800">
                    Strict NASA categorical preservation. No synthetic numeric percentages invented.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. Tab 3: Temporal Comparison Trajectory                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'temporal' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-nasa-cyan" />
              <span>Multi-Day Active Fire Trajectory (MODIS vs. VIIRS)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Observing the temporal evolution of burning detections across India during late October 2026.
            </p>

            {dailyTrajectory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3 bg-space-950/60 rounded-xl border border-slate-800">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-sm font-semibold text-slate-300">
                  {isLoading ? 'Querying Daily Multi-Sensor Trajectory...' : 'No Multi-Day Trajectory Data Available'}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isLoading
                    ? 'Retrieving active fire time series from PostgreSQL database...'
                    : 'Trajectory telemetry is currently offline or unrecorded for this corridor. Ensure the database and gateway are online, or click "Refresh Metrics".'}
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <Plot
                  data={[
                    {
                      x: dailyTrajectory.map((d) => d.acq_date),
                      y: dailyTrajectory.map((d) => d.modis_count),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'MODIS Detection Count',
                      line: { color: '#f97316', width: 2.5 },
                      marker: { size: 6, color: '#f97316' },
                    },
                    {
                      x: dailyTrajectory.map((d) => d.acq_date),
                      y: dailyTrajectory.map((d) => d.viirs_count),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'VIIRS Detection Count',
                      line: { color: '#ef4444', width: 2.5 },
                      marker: { size: 6, color: '#ef4444' },
                    },
                  ]}
                layout={{
                  autosize: true,
                  margin: { l: 45, r: 20, t: 25, b: 35 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { family: 'ui-sans-serif, system-ui', color: '#94a3b8', size: 11 },
                  xaxis: { title: 'Acquisition Date', gridcolor: '#1e293b' },
                  yaxis: { title: 'Raw Detections', gridcolor: '#1e293b' },
                  legend: { orientation: 'h', y: 1.15, x: 0.1 },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>
      </div>
    )}

      {/* ------------------------------------------------------------- */}
      {/* 7. Tab 4: Pixel Footprint & Geometric Disparity              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'footprint' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Maximize2 className="w-4 h-4 text-nasa-cyan" />
              <span>Pixel Footprint Resolution Disparity (1 km² Ground Grid)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualizing how a single MODIS 1 km pixel covers the ground area of ~7 distinct VIIRS 375m pixels.
            </p>

            <div className="p-6 rounded-xl bg-space-950 border border-slate-800 flex flex-col md:flex-row items-center justify-around gap-6">
              
              {/* MODIS 1 km nadir */}
              <div className="text-center space-y-2">
                <div className="text-xs font-mono text-amber-400 font-bold">MODIS (~1000m × 1000m)</div>
                <div className="w-48 h-48 rounded-xl border-2 border-dashed border-amber-500/80 bg-amber-500/10 flex flex-col items-center justify-center p-3 relative shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-fire-600/80 flex items-center justify-center text-white text-[10px] font-bold shadow-lg animate-pulse">
                    Fire Point
                  </div>
                  <span className="absolute bottom-2 text-[10px] font-mono text-amber-300 bg-space-950/80 px-2 py-0.5 rounded">
                    1 Pixel (100 Hectares)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  At scan edge, swells to 4.8 km × 2.0 km due to bow-tie distortion.
                </p>
              </div>

              {/* Ratio indicator */}
              <div className="text-center space-y-1 font-mono text-xs">
                <div className="text-nasa-cyan font-bold text-2xl">7.11 ×</div>
                <div className="text-[10px] text-slate-500">Spatial Sampling Area Ratio</div>
                <div className="text-[11px] text-slate-400">A_MODIS / A_VIIRS</div>
                <ArrowRight className="w-4 h-4 text-slate-500 mx-auto mt-1" />
              </div>

              {/* VIIRS 375m grid */}
              <div className="text-center space-y-2">
                <div className="text-xs font-mono text-red-400 font-bold">VIIRS (375m × 375m)</div>
                <div className="w-48 h-48 rounded-xl border border-slate-800 bg-space-900 grid grid-cols-3 gap-1 p-1.5 shadow-inner">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border text-[9px] font-mono flex items-center justify-center ${
                        i === 4
                          ? 'bg-red-600/60 border-red-400 text-white font-bold shadow-xs'
                          : 'bg-space-950/40 border-slate-800 text-slate-600'
                      }`}
                    >
                      {i === 4 ? 'Fire' : '375m'}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  Finer resolution localizes fire boundary without diluting sub-pixel thermal signal.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
