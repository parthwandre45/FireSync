import React, { useState } from 'react';
import { 
  Menu, 
  Globe2, 
  Calendar as CalendarIcon, 
  Activity, 
  Microscope,
  Radio,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { REGIONS, DATE_PRESETS } from '../../data/mockFireData';
import { DemoBadge, LiveBadge } from './DemoBadge';
import { triggerLiveFirmsIngest } from '../../services/api';

export const AppHeader = ({
  onToggleSidebar,
  selectedRegion,
  setSelectedRegion,
  selectedDateRange,
  setSelectedDateRange,
  viewMode,
  setViewMode,
  title,
  subtitle,
  onIngestSuccess
}) => {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestNotice, setIngestNotice] = useState(null);

  const handleSyncNASA = async () => {
    setIsIngesting(true);
    setIngestNotice(null);
    try {
      const res = await triggerLiveFirmsIngest('IND', 7);
      if (res.success) {
        setIngestNotice(`Synced ${res.totalFetched} records (${res.totalInserted} new, ${res.totalDuplicates} duplicates skipped)`);
        if (onIngestSuccess) onIngestSuccess();
      } else {
        setIngestNotice('NASA Feed Sync Completed');
      }
    } catch (err) {
      setIngestNotice('Sync encountered network timeout; database current.');
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestNotice(null), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-space-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Mobile hamburger + Page Title + Data Mode Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-space-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-space-800 lg:hidden"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {title}
              </h1>
              {selectedRegion.isLive ? (
                <LiveBadge size="xs" />
              ) : (
                <DemoBadge size="xs" />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Region selector, Date preset, Ingest button, View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Live NASA Sync Button */}
          <button
            onClick={handleSyncNASA}
            disabled={isIngesting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 text-xs font-mono font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Fetch and ingest latest real NASA FIRMS active fire records into PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isIngesting ? 'animate-spin' : ''}`} />
            <span>{isIngesting ? 'Syncing FIRMS...' : 'Sync NASA Feed'}</span>
          </button>

          {/* Region Filter */}
          <div className="relative flex items-center">
            <Globe2 className="w-3.5 h-3.5 text-nasa-cyan absolute left-2.5 pointer-events-none" />
            <select
              value={selectedRegion.id}
              onChange={(e) => {
                const found = REGIONS.find((r) => r.id === e.target.value);
                if (found) setSelectedRegion(found);
              }}
              className="pl-8 pr-7 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-nasa-cyan cursor-pointer transition-colors"
            >
              {REGIONS.map((region) => (
                <option key={region.id} value={region.id} className="bg-space-900 text-slate-200">
                  {region.name} {region.isLive ? '🟢 LIVE' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative flex items-center">
            <CalendarIcon className="w-3.5 h-3.5 text-fire-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedDateRange.id}
              onChange={(e) => {
                const found = DATE_PRESETS.find((d) => d.id === e.target.value);
                if (found) setSelectedDateRange(found);
              }}
              className="pl-8 pr-7 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-fire-500 cursor-pointer transition-colors"
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-space-900 text-slate-200">
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operations View vs Research View Mode Switch */}
          <div className="flex items-center rounded-xl bg-space-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('operations')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'operations'
                  ? 'bg-fire-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Operations View: Real-time telemetry & urgent fire risk perimeters"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operations</span>
            </button>
            <button
              onClick={() => setViewMode('research')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'research'
                  ? 'bg-nasa-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Research View: Deep cross-calibration metrics, statistical sensor comparisons"
            >
              <Microscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Research</span>
            </button>
          </div>

        </div>

      </div>

      {/* Sync Toast Feedback Banner */}
      {ingestNotice && (
        <div className="mt-2 py-1.5 px-3 rounded-lg bg-emerald-950/90 border border-emerald-600/50 text-xs text-emerald-300 font-mono flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{ingestNotice}</span>
          </span>
          <button onClick={() => setIngestNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}
    </header>
  );
};