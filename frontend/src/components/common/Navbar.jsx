import React from 'react';
import { Flame, Satellite, Activity, RefreshCw } from 'lucide-react';

export const Navbar = ({ healthStatus, onRefresh, isRefreshing }) => {
  const isHealthy = healthStatus?.status === 'healthy';

  return (
    <header className="border-b border-space-800 bg-space-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-fire-600 via-fire-500 to-nasa-gold shadow-lg shadow-fire-500/20">
            <Flame className="w-5 h-5 text-white animate-pulse" />
            <Satellite className="w-3.5 h-3.5 text-space-950 absolute -top-1 -right-1 p-0.5 bg-nasa-cyan rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FireSync
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-nasa-blue/40 text-nasa-cyan border border-nasa-cyan/30">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Unified Satellite Fire Intelligence (MODIS & VIIRS)
            </p>
          </div>
        </div>

        {/* Global System Telemetry Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-space-900/60 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="font-medium text-slate-300">
              {isHealthy ? 'Core Services Operational' : 'Service Verification Mode'}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 text-xs font-medium transition-all duration-200 border border-slate-700 hover:border-slate-500 disabled:opacity-50"
            title="Refresh All Service Health Checks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-nasa-cyan' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Check Services</span>
          </button>
        </div>

      </div>
    </header>
  );
};