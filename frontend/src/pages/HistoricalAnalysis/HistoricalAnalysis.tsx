import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart2,
  Layers,
  Flame,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// Historical 12-month trend data
const annualTrends = [
  { month: 'Jan', hotspots: 12400, frpAvg: 195 },
  { month: 'Feb', hotspots: 15800, frpAvg: 210 },
  { month: 'Mar', hotspots: 28400, frpAvg: 260 },
  { month: 'Apr', hotspots: 34100, frpAvg: 290 },
  { month: 'May', hotspots: 22000, frpAvg: 240 },
  { month: 'Jun', hotspots: 38900, frpAvg: 310 },
  { month: 'Jul', hotspots: 65400, frpAvg: 380 },
  { month: 'Aug', hotspots: 98200, frpAvg: 440 },
  { month: 'Sep', hotspots: 82100, frpAvg: 410 },
  { month: 'Oct', hotspots: 49500, frpAvg: 320 },
  { month: 'Nov', hotspots: 24100, frpAvg: 230 },
  { month: 'Dec', hotspots: 14200, frpAvg: 180 },
];

export const HistoricalAnalysis: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ day: number; count: number; dateStr: string } | null>(null);

  // Generate 30 days for burning activity calendar heatmap
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    // Mock seasonal variation
    const base = 1200 + Math.sin(i / 4) * 800 + Math.random() * 400;
    const count = Math.round(base);
    const intensity = count > 2000 ? 4 : count > 1600 ? 3 : count > 1200 ? 2 : 1;
    return {
      day,
      count,
      intensity,
      dateStr: `Aug ${day}, ${selectedYear}`,
    };
  });

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-nasa-cyan text-xs font-mono mb-1.5">
            <CalendarIcon className="w-4 h-4" />
            <span>HISTORICAL ARCHIVES & CLIMATE ANOMALIES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Burning Activity Calendar & Historical Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Decadal wildfire trends, seasonal fire weather anomalies, and daily global burning intensity calendars.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2 bg-space-900 border border-white/10 rounded-lg p-1 text-xs font-mono">
          {[2022, 2023, 2024].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedYear === yr
                  ? 'bg-nasa-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Burning Activity Calendar Grid Section */}
      <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Daily Wildfire Activity Calendar</span>
              <span className="text-xs font-mono font-normal text-nasa-orange px-2 py-0.5 rounded bg-nasa-orange/10 border border-nasa-orange/20">
                PEAK FIRE MONTH (AUGUST {selectedYear})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Heatmap representation of daily global active thermal anomalies
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span>LOW</span>
            <span className="w-3.5 h-3.5 rounded bg-space-800 border border-white/10" />
            <span className="w-3.5 h-3.5 rounded bg-amber-900/60 border border-amber-600/40" />
            <span className="w-3.5 h-3.5 rounded bg-orange-600/80 border border-orange-500" />
            <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400 shadow-sm" />
            <span>EXTREME</span>
          </div>
        </div>

        {/* Calendar Day Tiles */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 pt-2">
          {daysInMonth.map((d) => {
            const bgClass =
              d.intensity === 4
                ? 'bg-rose-600/80 border-rose-400 text-white shadow-glow-orange/20'
                : d.intensity === 3
                ? 'bg-orange-600/70 border-orange-400 text-white'
                : d.intensity === 2
                ? 'bg-amber-800/40 border-amber-600/40 text-amber-200'
                : 'bg-space-850 border-white/10 text-slate-400';

            return (
              <div
                key={d.day}
                onClick={() => setSelectedDayInfo(d)}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-105 ${bgClass} ${
                  selectedDayInfo?.day === d.day ? 'ring-2 ring-nasa-cyan' : ''
                }`}
              >
                <div className="text-[10px] font-mono font-bold">DAY {d.day}</div>
                <div className="text-xs font-mono font-bold mt-2">{d.count}</div>
                <div className="text-[9px] opacity-75">hotspots</div>
              </div>
            );
          })}
        </div>

        {/* Day Details Drawer */}
        {selectedDayInfo && (
          <div className="p-4 rounded-xl bg-space-950 border border-nasa-cyan/40 mt-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-3">
              <Flame className="w-5 h-5 text-nasa-orange" />
              <div>
                <span className="text-white font-bold">{selectedDayInfo.dateStr}</span>
                <p className="text-slate-400 text-[11px]">
                  Total {selectedDayInfo.count.toLocaleString()} satellite fire detections recorded globally.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDayInfo(null)}
              className="text-slate-400 hover:text-white"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>

      {/* Multi-Year Seasonal Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-nasa-cyan" />
              <span>Annual Fire Season Trajectory ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative monthly hotspot volume showing typical Boreal & Tropical summer peaks
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050a18',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hotspots"
                  name="Active Hotspots"
                  stroke="#ff5722"
                  strokeWidth={3}
                  dot={{ fill: '#ff5722', r: 4 }}
                  activeDot={{ r: 6, fill: '#00e5ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Fire Radiative Power (FRP) by Month */}
        <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Mean Monthly Fire Radiative Power (MW)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Heat release intensity per hotspot tracking peak summer drought stress
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050a18',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="frpAvg" name="Mean FRP (MW)" fill="#ffab00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

