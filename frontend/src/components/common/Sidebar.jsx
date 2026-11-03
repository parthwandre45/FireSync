import React from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  SlidersHorizontal, 
  Calendar, 
  TrendingUp, 
  FileCode2, 
  Home, 
  Satellite, 
  ChevronRight, 
  X,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  onGoToLanding 
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      description: 'System overview & real-time telemetry',
    },
    {
      id: 'explorer',
      label: 'Hotspot Explorer',
      icon: Flame,
      badge: 'Map',
      description: 'Geospatial active-fire detections',
    },
    {
      id: 'comparison',
      label: 'MODIS vs VIIRS',
      icon: SlidersHorizontal,
      badge: 'Compare',
      description: 'Sensor resolution & FRP disparity',
    },
    {
      id: 'calendar',
      label: 'Burning Calendar',
      icon: Calendar,
      badge: 'Timeline',
      description: 'Harmonized historical burning curve',
    },
    {
      id: 'historical',
      label: 'Historical Analysis',
      icon: TrendingUp,
      badge: 'Trends',
      description: 'Multi-year fire regime patterns',
    },
    {
      id: 'methodology',
      label: 'Data & Methodology',
      icon: FileCode2,
      badge: 'Docs',
      description: 'Algorithm specs & data export',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-space-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-space-900/95 border-r border-slate-800/80 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header & Logo */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <button 
              onClick={onGoToLanding}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fire-600 via-fire-500 to-amber-500 flex items-center justify-center shadow-lg shadow-fire-600/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                  FireSync
                </span>
                <div className="text-[10px] font-mono text-nasa-cyan flex items-center space-x-1">
                  <Satellite className="w-2.5 h-2.5" />
                  <span>NASA Space Apps</span>
                </div>
              </div>
            </button>

            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Navigation: Return to Landing */}
          <div className="p-3">
            <button
              onClick={onGoToLanding}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-space-800/60 border border-transparent hover:border-slate-800 transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4 text-slate-400" />
                <span>Return to Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Intelligence Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-fire-600/20 to-nasa-blue/20 text-white border border-fire-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-fire-600 text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className={`font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                    isActive 
                      ? 'bg-fire-500/20 border-fire-400/40 text-fire-300' 
                      : 'bg-space-800 border-slate-700 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Satellite Telemetry status */}
          <div className="p-3 m-3 rounded-2xl bg-space-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Satellite className="w-3.5 h-3.5 text-nasa-cyan" />
                <span className="font-semibold text-slate-200">Orbit Status</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] font-mono text-slate-400 space-y-1">
              <div>MODIS Aqua: Nominal</div>
              <div>VIIRS NOAA-21: Nominal</div>
              <div className="text-nasa-gold pt-1 text-[10px]">LANCE NRT Feed Synced</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};