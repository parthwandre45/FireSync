import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import {
  TrendingUp,
  Flame,
  BarChart3,
  Download,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Info,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  RefreshCw,
  Eye,
  Scale,
  FileText,
  Database,
  ExternalLink,
  Sliders,
  Activity,
  Maximize2
} from 'lucide-react';
import { INDIA_STATES } from '../data/indiaGeographicData';
import {
  fetchHistoricalAnalytics,
  fetchRegionalComparison,
  getHistoricalExportUrl,
} from '../services/api';

export const HistoricalAnalysisPage = ({ selectedRegion, viewMode = 'operations', onNavigate }) => {
  // Navigation tabs within Historical Analysis
  // 'trends' | 'seasonal' | 'anomaly' | 'comparison' | 'research' | 'export'
  const [activeTab, setActiveTab] = useState(viewMode === 'research' ? 'research' : 'trends');

  // Filter state
  const [selectedStateId, setSelectedStateId] = useState('ALL');
  const [selectedDatePreset, setSelectedDatePreset] = useState('full'); // 'full' (Oct 26 - Nov 03), 'october', 'november', 'extended' (Oct 01 - Nov 30)
  const [customStartDate, setCustomStartDate] = useState('2026-10-26');
  const [customEndDate, setCustomEndDate] = useState('2026-11-03');

  // Comparison State (for State A vs State B)
  const [compareStateA, setCompareStateA] = useState('PB'); // Punjab
  const [compareStateB, setCompareStateB] = useState('HR'); // Haryana
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Main Analytics Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Export State
  const [exportType, setExportType] = useState('daily_summary'); // 'daily_summary', 'observations', 'regional_summary'
  const [exportLimit, setExportLimit] = useState('5000');
  const [isExporting, setIsExporting] = useState(false);

  // Synchronize activeTab if viewMode prop changes from header
  useEffect(() => {
    if (viewMode === 'research') {
      setActiveTab('research');
    }
  }, [viewMode]);

  // Load Main Historical Analytics
  useEffect(() => {
    loadHistoricalData();
  }, [selectedStateId, selectedDatePreset, customStartDate, customEndDate]);

  // Load Regional Comparison when comparison tab is active or comparison states change
  useEffect(() => {
    if (activeTab === 'comparison') {
      loadRegionalComparison();
    }
  }, [activeTab, compareStateA, compareStateB]);

  const getDateRangeForPreset = () => {
    switch (selectedDatePreset) {
      case 'october':
        return { start: '2026-10-01', end: '2026-10-31' };
      case 'november':
        return { start: '2026-11-01', end: '2026-11-30' };
      case 'extended':
        return { start: '2026-10-01', end: '2026-11-30' };
      case 'full':
      default:
        return { start: '2026-10-26', end: '2026-11-03' };
    }
  };

  const loadHistoricalData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { start, end } = getDateRangeForPreset();
      const stateObj = INDIA_STATES.find((s) => s.id === selectedStateId);

      const params = {
        country: 'IND',
        startDate: start,
        endDate: end,
        regionName: stateObj?.name || 'All India',
        stateId: selectedStateId,
      };

      if (stateObj && stateObj.id !== 'ALL' && stateObj.bounds) {
        params.minLat = stateObj.bounds[0][0];
        params.maxLat = stateObj.bounds[1][0];
        params.minLon = stateObj.bounds[0][1];
        params.maxLon = stateObj.bounds[1][1];
      }

      const res = await fetchHistoricalAnalytics(params);
      if (res && res.success) {
        setAnalyticsData(res);
      } else {
        setLoadError(res?.error || 'Failed to retrieve historical analytics from server.');
      }
    } catch (err) {
      setLoadError(err.message || 'Network error querying historical database.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionalComparison = async () => {
    setIsLoadingComparison(true);
    try {
      const res = await fetchRegionalComparison({
        stateA: compareStateA,
        stateB: compareStateB,
        startDate: '2026-10-26',
        endDate: '2026-11-03',
      });
      if (res && res.success) {
        setComparisonData(res.comparison);
      }
    } catch (err) {
      console.error('Failed to load regional comparison:', err);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  // Direct CSV trigger
  const handleDownloadCsv = (typeToDownload) => {
    const targetType = typeToDownload || exportType;
    const { start, end } = getDateRangeForPreset();
    const stateObj = INDIA_STATES.find((s) => s.id === selectedStateId);

    const params = {
      type: targetType,
      country: 'IND',
      startDate: start,
      endDate: end,
      limit: exportLimit,
    };

    if (stateObj && stateObj.id !== 'ALL' && stateObj.bounds) {
      params.minLat = stateObj.bounds[0][0];
      params.maxLat = stateObj.bounds[1][0];
      params.minLon = stateObj.bounds[0][1];
      params.maxLon = stateObj.bounds[1][1];
    }

    const downloadUrl = getHistoricalExportUrl(params);
    window.open(downloadUrl, '_blank');
  };

  const currentStateObj = INDIA_STATES.find((s) => s.id === selectedStateId) || INDIA_STATES[0];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Configuration Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-fire-500" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Historical Fire Analysis & Research Intelligence
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PostgreSQL Ground Truth
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-sensor NASA FIRMS active fire trajectories, cross-instrument consistency, statistical anomaly detection, and empirical burned area models.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region / State Filter */}
            <div className="relative">
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                className="py-1.5 pl-3 pr-8 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-fire-500 cursor-pointer"
              >
                {INDIA_STATES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-space-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Window Preset */}
            <div className="relative">
              <select
                value={selectedDatePreset}
                onChange={(e) => setSelectedDatePreset(e.target.value)}
                className="py-1.5 pl-3 pr-8 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-nasa-cyan cursor-pointer"
              >
                <option value="full">Active Ingested Window (Oct 26 – Nov 03)</option>
                <option value="october">October 2026 (Month)</option>
                <option value="november">November 2026 (Month)</option>
                <option value="extended">Full Harvest Period (Oct 01 – Nov 30)</option>
              </select>
            </div>

            {/* Reload Button */}
            <button
              onClick={loadHistoricalData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-space-900 hover:bg-space-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Refresh Historical Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Summary KPI Banner */}
        {analyticsData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">MODIS Observations</span>
              <span className="text-amber-400 font-bold text-sm">
                {analyticsData.summary.totalModisDetections.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">1 km pixel footprint</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">VIIRS Observations</span>
              <span className="text-red-400 font-bold text-sm">
                {analyticsData.summary.totalViirsDetections.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">375 m I-band pixels</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Effective Detections (N_eff)</span>
              <span className="text-white font-bold text-sm">
                {analyticsData.summary.totalEffectiveBurningDetections.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 block">Deduplicated co-located</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Harmonized FRP</span>
              <span className="text-amber-300 font-bold text-sm">
                {analyticsData.summary.totalHarmonizedFrpMw.toLocaleString()} MW
              </span>
              <span className="text-[10px] text-slate-400 block">Radiated thermal energy</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Model Burned Area</span>
              <span className="text-emerald-300 font-bold text-sm">
                {analyticsData.summary.totalEstimatedBurnedAreaHa.toLocaleString()} Ha
              </span>
              <span className="text-[10px] text-slate-400 block">Wooster FRE (±35%)</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Coverage Fidelity</span>
              <span className="text-nasa-cyan font-bold text-sm">
                {analyticsData.summary.activeDaysMonitored} / {analyticsData.summary.totalDaysInWindow} Days
              </span>
              <span className="text-[10px] text-slate-400 block">Discrete satellite passes</span>
            </div>
          </div>
        )}

        {/* Phase 7 Guardrail Alert */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/30 flex items-start space-x-2.5 text-xs text-amber-200/90 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-mono">SCIENTIFIC INTEGRITY GUARDRAIL:</strong> Satellite hotspot detections represent thermal anomalies triggering sub-pixel brightness thresholds; they do <em>not</em> directly equate to confirmed physical wildfire perimeters or fire counts. MODIS and VIIRS observations are never added naively. All historical statistics outside the October 26 – November 03, 2026 database ingestion window are explicitly labeled as <span className="font-mono text-slate-300">NO_OBSERVATIONS</span> without data fabrication.
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 border-b border-slate-800/80 pt-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-fire-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-fire-500" />
            <span>Time Series Trajectory</span>
          </button>

          <button
            onClick={() => setActiveTab('seasonal')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'seasonal'
                ? 'border-nasa-cyan text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>Seasonal Harvest Regime & Multi-Year</span>
          </button>

          <button
            onClick={() => setActiveTab('anomaly')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'anomaly'
                ? 'border-amber-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Statistical Anomaly Detection</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-purple-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Regional State Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'research'
                ? 'border-emerald-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Research View & Data Quality</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-blue-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>NASA Data Export Hub</span>
          </button>
        </div>
      </div>

      {/* 2. Loading / Error States */}
      {isLoading && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-fire-500 animate-spin mx-auto" />
          <div className="text-sm font-medium text-white">Querying PostgreSQL Active Fire Store...</div>
          <div className="text-xs text-slate-400 font-mono">Aggregating multi-sensor NASA FIRMS records for {currentStateObj.name}</div>
        </div>
      )}

      {loadError && (
        <div className="glass-panel p-6 rounded-2xl border border-red-500/40 bg-red-950/20 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <div className="text-sm font-bold text-red-300">Database Query Failed</div>
          <div className="text-xs text-red-200 font-mono">{loadError}</div>
          <button
            onClick={loadHistoricalData}
            className="mt-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. TAB 1: Time Series & Multi-Sensor Trends */}
      {!isLoading && !loadError && activeTab === 'trends' && analyticsData && (
        <div className="space-y-6">
          {/* Main FRP and Burned Area Dual Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-fire-500" />
                <span>Daily Harmonized Fire Radiative Power (MW) and Wooster FRE Burned Area</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                Window: {analyticsData.query.startDate} to {analyticsData.query.endDate} • {currentStateObj.name}
              </span>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
              <Plot
                data={[
                  {
                    x: analyticsData.timeSeries.map((d) => d.date),
                    y: analyticsData.timeSeries.map((d) => d.harmonizedFrpMw),
                    name: 'Harmonized FRP (MW)',
                    type: 'bar',
                    marker: { color: 'rgba(239, 68, 68, 0.75)' },
                    yaxis: 'y1',
                  },
                  {
                    x: analyticsData.timeSeries.map((d) => d.date),
                    y: analyticsData.timeSeries.map((d) => d.estimatedBurnedAreaHa.nominal),
                    name: 'Nominal Burned Area (Ha)',
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: '#10b981', width: 2.5 },
                    marker: { size: 6, color: '#10b981' },
                    yaxis: 'y2',
                  },
                  {
                    x: analyticsData.timeSeries.map((d) => d.date),
                    y: analyticsData.timeSeries.map((d) => d.estimatedBurnedAreaHa.upper),
                    name: 'Burned Area Upper (+35%)',
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: 'rgba(16, 185, 129, 0.25)', width: 1, dash: 'dot' },
                    yaxis: 'y2',
                    showlegend: false,
                  },
                  {
                    x: analyticsData.timeSeries.map((d) => d.date),
                    y: analyticsData.timeSeries.map((d) => d.estimatedBurnedAreaHa.lower),
                    name: 'Burned Area Lower (-35%)',
                    type: 'scatter',
                    mode: 'lines',
                    fill: 'tonexty',
                    fillcolor: 'rgba(16, 185, 129, 0.08)',
                    line: { color: 'rgba(16, 185, 129, 0.25)', width: 1, dash: 'dot' },
                    yaxis: 'y2',
                    showlegend: false,
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 50, t: 25, b: 40 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  legend: {
                    orientation: 'h',
                    y: 1.15,
                    x: 0,
                    font: { color: '#94a3b8', size: 11 },
                  },
                  xaxis: {
                    color: '#94a3b8',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                    tickfont: { size: 10 },
                  },
                  yaxis: {
                    title: { text: 'FRP (MW)', font: { size: 10, color: '#ef4444' } },
                    color: '#94a3b8',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                  yaxis2: {
                    title: { text: 'Estimated Burned Area (Ha)', font: { size: 10, color: '#10b981' } },
                    overlaying: 'y',
                    side: 'right',
                    color: '#94a3b8',
                    gridcolor: 'transparent',
                  },
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </div>
          </div>

          {/* Separate MODIS vs VIIRS Detection Comparison Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>MODIS vs. VIIRS Independent Hotspot Detections</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Unweighted sensor counts</span>
              </div>

              <div className="w-full h-64 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
                <Plot
                  data={[
                    {
                      x: analyticsData.timeSeries.map((d) => d.date),
                      y: analyticsData.timeSeries.map((d) => d.modisDetections),
                      name: 'MODIS (1 km)',
                      type: 'bar',
                      marker: { color: '#f59e0b' },
                    },
                    {
                      x: analyticsData.timeSeries.map((d) => d.date),
                      y: analyticsData.timeSeries.map((d) => d.viirsDetections),
                      name: 'VIIRS (375 m)',
                      type: 'bar',
                      marker: { color: '#ef4444' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    barmode: 'group',
                    margin: { l: 45, r: 20, t: 25, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    legend: {
                      orientation: 'h',
                      y: 1.15,
                      font: { color: '#94a3b8', size: 10 },
                    },
                    xaxis: {
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 9 },
                    },
                    yaxis: {
                      title: { text: 'Detections', font: { size: 10, color: '#94a3b8' } },
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>
            </div>

            {/* Effective Burning Detections vs Raw Additive Error */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Effective Detections (N_eff) vs. Raw Sum Disparity</span>
                </span>
                <span className="font-mono text-emerald-400 text-[10px]">Deduplication Audit</span>
              </div>

              <div className="w-full h-64 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
                <Plot
                  data={[
                    {
                      x: analyticsData.timeSeries.map((d) => d.date),
                      y: analyticsData.timeSeries.map((d) => d.effectiveBurningDetections),
                      name: 'Effective N_eff (Deduplicated)',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#38bdf8', width: 2.5 },
                      marker: { size: 6, color: '#38bdf8' },
                    },
                    {
                      x: analyticsData.timeSeries.map((d) => d.date),
                      y: analyticsData.timeSeries.map((d) => d.rawTotalDetections),
                      name: 'Raw Sum (MODIS + VIIRS)',
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: 'rgba(148, 163, 184, 0.4)', dash: 'dash', width: 1.5 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 25, b: 35 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    legend: {
                      orientation: 'h',
                      y: 1.15,
                      font: { color: '#94a3b8', size: 10 },
                    },
                    xaxis: {
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                      tickfont: { size: 9 },
                    },
                    yaxis: {
                      title: { text: 'Detections', font: { size: 10, color: '#38bdf8' } },
                      color: '#94a3b8',
                      gridcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>
            </div>
          </div>

          {/* Daily Granular Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-nasa-cyan" />
                <span>Daily Historical Observation Audit Table</span>
              </h3>
              <button
                onClick={() => handleDownloadCsv('daily_summary')}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-space-800 hover:bg-space-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-nasa-cyan" />
                <span>Download Daily CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead className="sticky top-0 bg-space-950 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-amber-400">MODIS</th>
                    <th className="py-2 px-3 text-red-400">VIIRS</th>
                    <th className="py-2 px-3 text-emerald-400">Matched</th>
                    <th className="py-2 px-3 text-white">N_eff</th>
                    <th className="py-2 px-3 text-amber-300">Harmonized FRP</th>
                    <th className="py-2 px-3 text-emerald-300">Burned Area (Ha)</th>
                    <th className="py-2 px-3">Z-Score</th>
                    <th className="py-2 px-3">Anomaly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {analyticsData.timeSeries.map((row) => (
                    <tr
                      key={row.date}
                      className={row.hasData ? 'hover:bg-space-900/60' : 'bg-space-950/40 text-slate-600'}
                    >
                      <td className="py-2 px-3 font-bold text-white">{row.date}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            row.hasData
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {row.dataAvailability}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-amber-300">{row.modisDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-red-300">{row.viirsDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{row.matchedPairs}</td>
                      <td className="py-2 px-3 text-white font-bold">{row.effectiveBurningDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-amber-300 font-bold">
                        {row.hasData ? `${row.harmonizedFrpMw.toLocaleString()} MW` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-emerald-300">
                        {row.hasData ? `${row.estimatedBurnedAreaHa.nominal.toLocaleString()} Ha` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {row.anomaly.zScore !== null ? `${row.anomaly.zScore > 0 ? '+' : ''}${row.anomaly.zScore}` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            row.anomaly.level === 'ANOMALOUS_HIGH'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : row.anomaly.level === 'ELEVATED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : row.anomaly.level === 'SUPPRESSED'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : row.anomaly.level === 'TYPICAL'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {row.anomaly.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: Seasonal Harvest Regime & Multi-Year Analysis */}
      {!isLoading && !loadError && activeTab === 'seasonal' && analyticsData && (
        <div className="space-y-6">
          {/* Monthly Comparison */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-nasa-cyan" />
                  <span>Post-Monsoon Kharif Harvest Burning Season (October vs. November 2026)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison between late October crop residue ignition peak and early November dispersion trajectory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.monthlySummaries.map((m) => (
                <div key={m.yearMonth} className="p-4 rounded-xl bg-space-900/80 border border-slate-800 space-y-3 font-mono">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-sm text-white">{m.monthName} {m.year}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-space-950 text-slate-400 border border-slate-800">
                      Active Ingested Days
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">MODIS Detections</span>
                      <span className="text-amber-400 font-bold">{m.modisDetections.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">VIIRS Detections</span>
                      <span className="text-red-400 font-bold">{m.viirsDetections.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Effective Detections (N_eff)</span>
                      <span className="text-white font-bold">{m.effectiveDetections.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Harmonized FRP</span>
                      <span className="text-amber-300 font-bold">{m.harmonizedFrpMw.toLocaleString()} MW</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Model Burned Area (Wooster FRE)</span>
                      <span className="text-emerald-300 font-bold text-sm">{m.estimatedBurnedAreaHa.toLocaleString()} Ha</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Honest Multi-Year Archive Status (Non-Fabrication Policy) */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Decadal Archive Status Audit (2020–2026)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verification of PostgreSQL database storage. Strict compliance with non-fabrication principles.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Data Provenance Certified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Database Archive Status</th>
                    <th className="py-2 px-3 text-amber-400">MODIS Pixels</th>
                    <th className="py-2 px-3 text-red-400">VIIRS Pixels</th>
                    <th className="py-2 px-3 text-white">Effective (N_eff)</th>
                    <th className="py-2 px-3 text-amber-300">Harmonized FRP</th>
                    <th className="py-2 px-3">Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {analyticsData.multiYearRegime.map((row) => (
                    <tr
                      key={row.year}
                      className={row.status === 'ACTIVE_OBSERVATIONS' ? 'bg-space-900/60 font-semibold' : 'text-slate-500'}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{row.year}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            row.status === 'ACTIVE_OBSERVATIONS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800/80 text-slate-400'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-300">
                        {row.modis > 0 ? row.modis.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-red-300">
                        {row.viirs > 0 ? row.viirs.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        {row.effective ? row.effective.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300">
                        {row.frp > 0 ? `${row.frp.toLocaleString()} MW` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-space-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-nasa-cyan" />
                <span>Multi-Year Comparison Guidelines</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                FireSync maintains strict scientific fidelity: observations for absent years (2020–2025) are not fabricated with synthetic estimators. When full decadal NASA FIRMS historical archives are ingested via FIRMS batch API or LANCE bulk download, multi-year trend regressions will automatically populate across these baseline years.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: Statistical Anomaly Detection & Baselines */}
      {!isLoading && !loadError && activeTab === 'anomaly' && analyticsData && (
        <div className="space-y-6">
          {/* Anomaly Baseline Metrics Cards */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Climatological & Empirical Anomaly Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Z-score statistical deviation metric computed from the active observation baseline.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-900 text-slate-300 border border-slate-800">
                Sample Size N = {analyticsData.anomalyBaseline.sampleDaysCount} active days
              </span>
            </div>

            {/* Baseline Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">Baseline Mean FRP (μ)</span>
                <span className="text-amber-400 font-bold text-base">
                  {analyticsData.anomalyBaseline.baselineMeanFrpMw.toLocaleString()} MW
                </span>
                <span className="text-[10px] text-slate-400 block">Sample average thermal output</span>
              </div>

              <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">Baseline Standard Deviation (σ)</span>
                <span className="text-slate-200 font-bold text-base">
                  {analyticsData.anomalyBaseline.baselineStdFrpMw.toLocaleString()} MW
                </span>
                <span className="text-[10px] text-slate-400 block">Day-to-day energy dispersion</span>
              </div>

              <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">Formulation & Model Standard</span>
                <span className="text-nasa-cyan font-bold text-sm block font-mono">
                  {analyticsData.anomalyBaseline.formula}
                </span>
                <span className="text-[10px] text-slate-400 block">Standardized normal deviation</span>
              </div>
            </div>

            {/* Threshold Classification Reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300">
                <div className="font-bold text-[11px]">ANOMALOUS HIGH</div>
                <div className="text-[10px] text-red-400">Z ≥ +1.50 (Thermal surge)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
                <div className="font-bold text-[11px]">ELEVATED</div>
                <div className="text-[10px] text-amber-400">+0.75 ≤ Z &lt; +1.50</div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                <div className="font-bold text-[11px]">TYPICAL</div>
                <div className="text-[10px] text-emerald-400">-0.75 ≤ Z &lt; +0.75</div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300">
                <div className="font-bold text-[11px]">SUPPRESSED</div>
                <div className="text-[10px] text-blue-400">Z &lt; -0.75 (Suppression)</div>
              </div>
            </div>

            {/* Z-score Plot across Time Series */}
            <div className="w-full h-64 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
              <Plot
                data={[
                  {
                    x: analyticsData.timeSeries.filter((d) => d.hasData).map((d) => d.date),
                    y: analyticsData.timeSeries.filter((d) => d.hasData).map((d) => d.anomaly.zScore),
                    name: 'Daily Z-Score',
                    type: 'bar',
                    marker: {
                      color: analyticsData.timeSeries
                        .filter((d) => d.hasData)
                        .map((d) =>
                          d.anomaly.zScore >= 1.5
                            ? '#ef4444'
                            : d.anomaly.zScore >= 0.75
                            ? '#f59e0b'
                            : d.anomaly.zScore <= -0.75
                            ? '#38bdf8'
                            : '#10b981'
                        ),
                    },
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 45, r: 20, t: 25, b: 35 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  shapes: [
                    {
                      type: 'line',
                      x0: 0,
                      x1: 1,
                      xref: 'paper',
                      y0: 1.5,
                      y1: 1.5,
                      line: { color: 'rgba(239, 68, 68, 0.4)', dash: 'dot', width: 1.5 },
                    },
                    {
                      type: 'line',
                      x0: 0,
                      x1: 1,
                      xref: 'paper',
                      y0: -0.75,
                      y1: -0.75,
                      line: { color: 'rgba(56, 189, 248, 0.4)', dash: 'dot', width: 1.5 },
                    },
                  ],
                  xaxis: {
                    color: '#94a3b8',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                    tickfont: { size: 10 },
                  },
                  yaxis: {
                    title: { text: 'Z-Score (Std Deviations)', font: { size: 10, color: '#94a3b8' } },
                    color: '#94a3b8',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </div>

            {/* Disclaimer & Limitations */}
            <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Assumptions & Physical Limitations of Anomaly Detection</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong>Not a Wildfire Disaster Classifier:</strong> Anomaly Z-scores represent empirical statistical departures from the monitored sample mean; they do not confirm physical wildfire emergencies or ground destruction.
                </li>
                <li>
                  <strong>Sample Size Limitation:</strong> Baseline is computed over the current active post-monsoon harvest burning window (N = 9 days). Multi-decadal climatology requires a 10+ year FIRMS baseline to separate interannual meteorological variability from harvest timing shifts.
                </li>
                <li>
                  <strong>Missing Coverage Accountability:</strong> Dates outside the active observation window or with obscured satellite passes are assigned <span className="font-mono text-slate-200">NO_OBSERVATIONS</span> rather than zero activity, avoiding false suppression signals.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: Regional State Comparison Engine */}
      {!isLoading && !loadError && activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Selector Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  <span>State & District Side-by-Side Comparison Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contrast spatial density, sensor pixel disparity, and FRP thermal release between key Indian agricultural states.
                </p>
              </div>

              {/* State Selectors */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">Region A:</span>
                  <select
                    value={compareStateA}
                    onChange={(e) => setCompareStateA(e.target.value)}
                    className="py-1 px-2.5 rounded-lg bg-space-900 border border-slate-800 text-white font-bold cursor-pointer"
                  >
                    <option value="PB">Punjab (PB)</option>
                    <option value="HR">Haryana (HR)</option>
                    <option value="RJ">Rajasthan (RJ)</option>
                    <option value="MP">Madhya Pradesh (MP)</option>
                    <option value="UP">Uttar Pradesh (UP)</option>
                    <option value="MH">Maharashtra (MH)</option>
                    <option value="CG">Chhattisgarh (CG)</option>
                    <option value="OD">Odisha (OD)</option>
                  </select>
                </div>

                <span className="text-slate-500 font-bold">VS</span>

                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">Region B:</span>
                  <select
                    value={compareStateB}
                    onChange={(e) => setCompareStateB(e.target.value)}
                    className="py-1 px-2.5 rounded-lg bg-space-900 border border-slate-800 text-white font-bold cursor-pointer"
                  >
                    <option value="HR">Haryana (HR)</option>
                    <option value="PB">Punjab (PB)</option>
                    <option value="RJ">Rajasthan (RJ)</option>
                    <option value="MP">Madhya Pradesh (MP)</option>
                    <option value="UP">Uttar Pradesh (UP)</option>
                    <option value="MH">Maharashtra (MH)</option>
                    <option value="CG">Chhattisgarh (CG)</option>
                    <option value="OD">Odisha (OD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Results Card */}
            {isLoadingComparison && (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-400 mb-2" />
                Aggregating spatial bounds for comparison...
              </div>
            )}

            {!isLoadingComparison && comparisonData && (
              <div className="space-y-4">
                {/* Comparative KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Region A Card */}
                  <div className="p-4 rounded-xl bg-space-900/80 border border-purple-500/30 space-y-3 font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-base font-bold text-white flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span>{comparisonData.regionA.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Area: {comparisonData.regionA.areaKm2.toLocaleString()} km²</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Effective Detections</span>
                        <span className="text-white font-bold text-sm">
                          {comparisonData.regionA.summary.totalEffectiveBurningDetections.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Harmonized FRP</span>
                        <span className="text-amber-400 font-bold text-sm">
                          {comparisonData.regionA.summary.totalHarmonizedFrpMw.toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Fire Density</span>
                        <span className="text-purple-300 font-bold text-sm">
                          {comparisonData.regionA.densityPer10kKm2} / 10k km²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Model Burned Area</span>
                        <span className="text-emerald-300 font-bold text-sm">
                          {comparisonData.regionA.summary.totalEstimatedBurnedAreaHa.toLocaleString()} Ha
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Region B Card */}
                  <div className="p-4 rounded-xl bg-space-900/80 border border-nasa-cyan/30 space-y-3 font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-base font-bold text-white flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-nasa-cyan" />
                        <span>{comparisonData.regionB.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Area: {comparisonData.regionB.areaKm2.toLocaleString()} km²</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Effective Detections</span>
                        <span className="text-white font-bold text-sm">
                          {comparisonData.regionB.summary.totalEffectiveBurningDetections.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Harmonized FRP</span>
                        <span className="text-amber-400 font-bold text-sm">
                          {comparisonData.regionB.summary.totalHarmonizedFrpMw.toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Fire Density</span>
                        <span className="text-nasa-cyan font-bold text-sm">
                          {comparisonData.regionB.densityPer10kKm2} / 10k km²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Model Burned Area</span>
                        <span className="text-emerald-300 font-bold text-sm">
                          {comparisonData.regionB.summary.totalEstimatedBurnedAreaHa.toLocaleString()} Ha
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative Ratio Summary */}
                {comparisonData.ratios && (
                  <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-around gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Detections Ratio (A/B)</span>
                      <span className="font-bold text-white text-sm">
                        {comparisonData.ratios.effectiveDetectionsRatio ? `${comparisonData.ratios.effectiveDetectionsRatio}×` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">FRP Energy Ratio (A/B)</span>
                      <span className="font-bold text-amber-400 text-sm">
                        {comparisonData.ratios.harmonizedFrpRatio ? `${comparisonData.ratios.harmonizedFrpRatio}×` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Density Ratio (A/B)</span>
                      <span className="font-bold text-purple-300 text-sm">
                        {comparisonData.ratios.densityRatio ? `${comparisonData.ratios.densityRatio}×` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Full National State-by-State Ranking Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-nasa-cyan" />
                  <span>All India State Active Fire Ranking (Database Ground Truth)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by effective detections within respective state geographic bounding boxes.
                </p>
              </div>
              <button
                onClick={() => handleDownloadCsv('regional_summary')}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-space-800 hover:bg-space-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-nasa-cyan" />
                <span>Export States CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">State</th>
                    <th className="py-2 px-3 text-amber-400">MODIS</th>
                    <th className="py-2 px-3 text-red-400">VIIRS</th>
                    <th className="py-2 px-3 text-white">Effective (N_eff)</th>
                    <th className="py-2 px-3 text-amber-300">Total FRP</th>
                    <th className="py-2 px-3 text-emerald-300">Burned Area (Ha)</th>
                    <th className="py-2 px-3 text-purple-300">Density / 10k km²</th>
                    <th className="py-2 px-3 text-slate-400">VIIRS:MODIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {analyticsData.regionalBreakdown.map((row, idx) => (
                    <tr key={row.stateId} className="hover:bg-space-900/60">
                      <td className="py-2 px-3 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-white">{row.stateName}</td>
                      <td className="py-2 px-3 text-amber-300">{row.modisDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-red-300">{row.viirsDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-white font-bold">{row.effectiveDetections.toLocaleString()}</td>
                      <td className="py-2 px-3 text-amber-300 font-bold">{row.totalFrpMw.toLocaleString()} MW</td>
                      <td className="py-2 px-3 text-emerald-300">{row.estimatedBurnedAreaHa.toLocaleString()} Ha</td>
                      <td className="py-2 px-3 text-purple-300 font-bold">{row.detectionDensityPer10kKm2}</td>
                      <td className="py-2 px-3 text-slate-400">{row.pixelRatioViirsToModis}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: Scientific Research View & Data Quality */}
      {!isLoading && !loadError && activeTab === 'research' && analyticsData && (
        <div className="space-y-6">
          {/* Instrument Disparity & Physical Footprint Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-fire-500" />
                <span>Pixel Footprint Disparity</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                VIIRS 375 m I-bands have a pixel footprint area of ~0.14 km² compared to MODIS 1.0 km².
                This yields a <strong>~7.14× spatial resolution advantage</strong>, enabling VIIRS to resolve small, low-intensity crop fires that remain below the MODIS sub-pixel point spread function trigger threshold.
              </p>
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Observed Pixel Ratio:</span>
                  <span className="text-fire-400 font-bold">{analyticsData.researchQuality.pixelCountRatioViirsToModis}× (VIIRS:MODIS)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Theoretical Area Ratio:</span>
                  <span className="text-white">7.14 : 1</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-nasa-gold" />
                <span>Diurnal Day / Night Distribution</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Polar sun-synchronous satellites sample fires during discrete daylight (~10:30 & 13:30 LST) and nighttime (~22:30 & 01:30 LST) overpasses.
                Agricultural crop burning exhibits strong diurnal preference for afternoon hours.
              </p>
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Daytime Detections:</span>
                  <span className="text-amber-400 font-bold">
                    {analyticsData.researchQuality.diurnalDistribution.dayDetections.toLocaleString()} ({analyticsData.researchQuality.diurnalDistribution.dayPercent}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nighttime Detections:</span>
                  <span className="text-blue-400 font-bold">
                    {analyticsData.researchQuality.diurnalDistribution.nightDetections.toLocaleString()} ({analyticsData.researchQuality.diurnalDistribution.nightPercent}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-nasa-cyan" />
                <span>Mean FRP per Detection</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Because MODIS requires larger or hotter thermal anomalies to exceed background variance, its mean observed FRP per pixel is consistently higher than VIIRS.
              </p>
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">MODIS Mean FRP:</span>
                  <span className="text-amber-400 font-bold">{analyticsData.researchQuality.meanModisFrpPerDetectionMw} MW / pixel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VIIRS Mean FRP:</span>
                  <span className="text-red-400 font-bold">{analyticsData.researchQuality.meanViirsFrpPerDetectionMw} MW / pixel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Uncertainty Decomposition Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Scientific Uncertainty Propagation & Error Budget</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quantitative breakdown of observational and model uncertainties in fire radiative energy and burned area retrieval.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3">Pipeline Component</th>
                    <th className="py-2 px-3 text-amber-400">Uncertainty Bound</th>
                    <th className="py-2 px-3">Governing Source & Literature Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {analyticsData.researchQuality.uncertaintyDecomposition.map((u, i) => (
                    <tr key={i} className="hover:bg-space-900/60">
                      <td className="py-2.5 px-3 font-bold text-white">{u.component}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">{u.uncertainty}</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 6: NASA Data Export Hub */}
      {!isLoading && !loadError && activeTab === 'export' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-400" />
                <span>NASA FIRMS Dataset Export Hub</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate and download verified RFC 4180-compliant CSV datasets from local PostgreSQL storage with complete metadata provenance headers.
              </p>
            </div>

            {/* Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Daily Summary */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Calendar className="w-4 h-4 text-nasa-cyan" />
                    <span>Daily Historical Summary CSV</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Time series of daily aggregated observations, sensor counts (MODIS & VIIRS), matched pairs, effective count (N_eff), FRP, Wooster FRE burned area bounds, and Z-score anomaly indices.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadCsv('daily_summary')}
                  className="w-full py-2 px-3 rounded-xl bg-space-800 hover:bg-space-700 text-nasa-cyan font-mono text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Daily Summary</span>
                </button>
              </div>

              {/* Option 2: Filtered Observations */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Flame className="w-4 h-4 text-fire-500" />
                    <span>Filtered NASA Observations CSV</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Granular observation-by-observation records including satellite platform, exact latitude/longitude, UTC timestamp, FRP (MW), day/night pass, and normalized confidence.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadCsv('observations')}
                  className="w-full py-2 px-3 rounded-xl bg-fire-600 hover:bg-fire-500 text-white font-mono text-xs font-semibold shadow-md shadow-fire-600/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Observations</span>
                </button>
              </div>

              {/* Option 3: Regional Summary */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Regional State Breakdown CSV</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    State-by-state summary for Punjab, Haryana, Rajasthan, Madhya Pradesh, Uttar Pradesh, Maharashtra, Chhattisgarh, and Odisha with detection density per 10k km².
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadCsv('regional_summary')}
                  className="w-full py-2 px-3 rounded-xl bg-space-800 hover:bg-space-700 text-purple-300 font-mono text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download States CSV</span>
                </button>
              </div>
            </div>

            {/* Provenance Header Preview */}
            <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 font-mono">Export Metadata Provenance Preview:</span>
              <pre className="text-[11px] font-mono text-slate-400 bg-space-900/80 p-3 rounded-lg overflow-x-auto border border-slate-800/80 leading-relaxed">
{`# NASA FIRMS Harmonized Active Fire Data Export - FireSync Platform
# Export Type: DAILY_SUMMARY
# Generated UTC: 2026-11-03T23:00:00.000Z
# Country Code: IND (India)
# Date Range: 2026-10-26 to 2026-11-03
# Data Source: Real NASA FIRMS LANCE NRT (Aqua, Terra, Suomi-NPP, NOAA-20)
# Guardrail: Detections are thermal anomalies; they do NOT equate to confirmed physical wildfires.
# Status: Harmonized effective counts and FRE burned areas are EXPERIMENTAL RESEARCH PROXIES (Wooster et al. 2005) with +-35% bounds.`}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoricalAnalysisPage;
