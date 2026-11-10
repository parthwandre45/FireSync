import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Activity,
  Satellite,
  Compass,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Cpu,
  Globe2,
  ArrowRightLeft,
} from 'lucide-react';
import { TacticalLeafletMap } from './TacticalLeafletMap';
import { REALISTIC_HOTSPOTS, HotspotPoint } from '../earth/fireData';
import { HotspotExplorer } from '../../pages/HotspotExplorer/HotspotExplorer';

// Circular Radial Gauge component inspired by the reference screenshot
const RadialGauge: React.FC<{
  percentage: number;
  label: string;
  sublabel: string;
  color: string;
}> = ({ percentage, label, sublabel, color }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3.5"
            fill="transparent"
          />
          {/* Progress fill */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-white">
          {percentage}%
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold text-slate-200 mt-1">{label}</span>
      <span className="text-[9px] font-mono text-slate-400">{sublabel}</span>
    </div>
  );
};

// Subtle animated audio/signal telemetry waveform line inspired by the reference image
const TelemetryWaveform: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 py-1 select-none pointer-events-none opacity-60">
      <svg className="w-48 sm:w-64 h-5 overflow-visible" viewBox="0 0 200 20">
        <path
          d="M 0 10 Q 15 10 25 10 T 40 4 T 50 16 T 60 7 T 70 12 T 85 2 T 95 18 T 105 10 T 120 10 T 135 5 T 145 15 T 160 8 T 175 10 T 200 10"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1.2"
          strokeOpacity="0.75"
        />
        <circle cx="95" cy="18" r="2" fill="#ff9100" />
      </svg>
    </div>
  );
};

interface GlobalWildfireDashboardProps {
  opacity: number;
  isMapExpanded?: boolean;
  onToggleMapExpand?: () => void;
}

export const GlobalWildfireDashboard: React.FC<GlobalWildfireDashboardProps> = ({
  opacity,
  isMapExpanded = false,
  onToggleMapExpand,
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotPoint | null>(REALISTIC_HOTSPOTS[0]);
  const [currentTime, setCurrentTime] = useState<string>('');

  const handleSelectMapTab = () => {
    if (!isMapExpanded && onToggleMapExpand) {
      onToggleMapExpand();
    }
  };

  const handleCollapseMap = () => {
    if (isMapExpanded && onToggleMapExpand) {
      onToggleMapExpand();
    }
  };

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (opacity <= 0.01) return null;

  return (
    <div
      style={{ opacity }}
      className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between pt-20 pb-3 px-3 sm:px-5 lg:px-6 transition-opacity duration-300 font-sans"
    >
      {/* ================= 1. DASHBOARD SCI-FI CORNER BRACKETS & FRAME ================= */}
      <div className="absolute top-[72px] left-2 w-4 h-4 border-t-2 border-l-2 border-nasa-cyan/60 pointer-events-none" />
      <div className="absolute top-[72px] right-2 w-4 h-4 border-t-2 border-r-2 border-nasa-cyan/60 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-nasa-cyan/60 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-nasa-cyan/60 pointer-events-none" />

      {/* ================= 2. TOP HUD STATUS (UNCLUTTERED) ================= */}
      <div className="w-full flex items-center justify-end px-2 pointer-events-auto">
        <div className="flex items-center space-x-3 font-mono text-xs px-3 py-1.5 rounded-xl bg-space-950/80 border border-nasa-cyan/25 backdrop-blur-md shadow-lg">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
            <span className="font-bold tracking-widest">{currentTime || '22:30:05 UTC'}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>EOS FEEDS NOMINAL</span>
          </div>
        </div>
      </div>

      {/* ================= 3. MAIN DASHBOARD CONTENT GRID (ARRANGED AROUND CENTRAL EARTH) ================= */}
      <div
        className={`flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 pointer-events-none ${
          isMapExpanded ? 'items-start' : 'items-center'
        }`}
      >
        {/* ================= LEFT COLUMN: GLOBAL METRICS & INTERACTIVE TACTICAL MAP ================= */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-3 pointer-events-auto h-[calc(100vh-135px)] max-h-[calc(100vh-135px)] overflow-y-auto pr-1">
          {/* Card 1: Global Wildfire Summary */}
          <div className="p-3.5 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
              <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                <span>GLOBAL WILDFIRE STATUS</span>
              </span>
              <span className="text-[10px] text-slate-400">LAST PASS: 12 MIN AGO</span>
            </div>

            {/* High-Impact Metric Numbers (Inspired by reference screenshot) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] text-slate-400 tracking-wider">ACTIVE HOTSPOTS</p>
                <p className="text-2xl font-bold text-nasa-orange tracking-tight">2,842</p>
                <p className="text-[9px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>+18% SEASONAL PEAK</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 tracking-wider">EST. AREA AT RISK</p>
                <p className="text-2xl font-bold text-sky-300 tracking-tight">186,072 <span className="text-xs font-normal text-slate-400">HA</span></p>
                <p className="text-[9px] text-slate-400 mt-0.5">CONTINENTAL BIOMES</p>
              </div>
            </div>

            {/* Sub-grid Telemetry */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-1.5 rounded bg-white/5">
                <p className="text-[9px] text-slate-400">VIIRS 375M</p>
                <p className="text-xs font-bold text-nasa-orange">1,724</p>
              </div>
              <div className="p-1.5 rounded bg-white/5">
                <p className="text-[9px] text-slate-400">MODIS 1KM</p>
                <p className="text-xs font-bold text-nasa-cyan">1,118</p>
              </div>
              <div className="p-1.5 rounded bg-white/5">
                <p className="text-[9px] text-slate-400">PEAK FRP</p>
                <p className="text-xs font-bold text-white">418 MW</p>
              </div>
            </div>
          </div>

          {/* Card 2: When NOT expanded, Tactical Map sits here. When expanded, 3D Earth Docking Port sits here! */}
          {!isMapExpanded ? (
            <div className="p-3 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-nasa-orange" />
                  <span>TACTICAL FIRMS RADAR</span>
                </span>
                <button
                  onClick={handleSelectMapTab}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-nasa-cyan/15 hover:bg-nasa-cyan/30 border border-nasa-cyan/40 text-nasa-cyan text-[10px] font-bold transition-all cursor-pointer"
                  title="Expand into full Hotspot Map & Satellite View"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>EXPAND FULL MAP</span>
                </button>
              </div>

              <TacticalLeafletMap
                selectedHotspot={selectedHotspot}
                onSelectHotspot={(point) => setSelectedHotspot(point)}
                isExpanded={false}
                onToggleExpand={handleSelectMapTab}
              />
            </div>
          ) : (
            <div
              id="planet-docked-view-box"
              className="p-3.5 rounded-xl bg-space-950/20 border border-nasa-cyan/40 font-mono space-y-2.5 shadow-xl h-[240px] flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5 z-10">
                <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-nasa-cyan animate-spin" style={{ animationDuration: '8s' }} />
                  <span>3D PLANET DOCKED VIEW</span>
                </span>
                <button
                  onClick={handleCollapseMap}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-nasa-cyan/15 hover:bg-nasa-cyan/30 border border-nasa-cyan/40 text-nasa-cyan text-[10px] font-bold transition-all cursor-pointer"
                  title="Swap 3D Earth back to Center"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>SWAP TO CENTER</span>
                </button>
              </div>

              {/* Targeting reticle framing the docked 3D Earth */}
              <div className="flex-1 flex flex-col items-center justify-center relative select-none pointer-events-none">
                <div
                  id="planet-docked-view-target"
                  className="w-32 h-32 rounded-full border border-dashed border-nasa-cyan/60 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                >
                  <div className="absolute inset-0 rounded-full border border-nasa-cyan/25 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-nasa-cyan" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-nasa-cyan" />
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 h-2 w-0.5 bg-nasa-cyan" />
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-0.5 bg-nasa-cyan" />
                </div>
                <span className="text-[9px] text-nasa-cyan tracking-widest mt-1 z-10 font-bold">
                  [ 3D GLOBE IN TELEMETRY DOCK ]
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10 pt-1 z-10">
                <span>AXIAL ROTATION: ACTIVE</span>
                <span className="text-nasa-orange font-bold">REAL-TIME HOTSPOTS</span>
              </div>
            </div>
          )}

          {/* Card 3: Recent Observation Timeline */}
          <div className="p-3.5 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
              <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>OBSERVATION DISPATCH FEED</span>
              </span>
              <span className="text-[9px] text-slate-400">REAL-TIME</span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {REALISTIC_HOTSPOTS.slice(0, 4).map((h) => {
                const isSelected = selectedHotspot?.id === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHotspot(h)}
                    className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer text-[10px] leading-tight flex items-start justify-between ${
                      isSelected
                        ? 'bg-nasa-orange/20 border-nasa-orange text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-nasa-cyan/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-nasa-orange">●</span>
                        <span>{h.region}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {h.satellite} // {h.lat.toFixed(1)}°, {h.lon.toFixed(1)}°
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">{h.frp} MW</span>
                      <div className="text-[9px] text-emerald-400">{h.confidence}% conf</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: EITHER CLEAR FOR 3D EARTH OR SWAPPED WITH FULL HOTSPOT EXPLORER ================= */}
        <div
          className={`${
            isMapExpanded
              ? 'lg:col-span-8 xl:col-span-9 h-[calc(100vh-135px)] min-h-0'
              : 'lg:col-span-4 xl:col-span-6 h-full justify-between items-center pb-2'
          } flex flex-col pointer-events-none transition-all duration-300`}
        >
          {/* If Map is expanded, it takes the Center Stage where Earth was! */}
          {isMapExpanded ? (
            <div className="w-full h-full flex-1 min-h-0 pointer-events-auto flex flex-col">
              <HotspotExplorer
                isEmbedded={true}
                onClose={handleCollapseMap}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Subtle Bottom Waveform and Orbit Readout */}
          {!isMapExpanded && (
            <div className="flex flex-col items-center pointer-events-auto bg-space-950/70 border border-nasa-cyan/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-1 shadow-glow-cyan/10">
              <TelemetryWaveform />
              <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
                <span className="text-nasa-cyan font-bold">
                  EOS SENSORS ACTIVE // MODIS & VIIRS
                </span>
                <span>//</span>
                <span>ALTITUDE: 705 KM</span>
                <span>//</span>
                <span className="text-nasa-orange font-bold">PASS: NOMINAL</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: REGIONAL RANKING & SENSOR DISTRIBUTION (Hidden when map expands across center stage) ================= */}
        {!isMapExpanded && (
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-3 pointer-events-auto max-h-[calc(100vh-130px)] overflow-y-auto pl-1">
            {/* Card 1: Top Regional Wildfire Zones (Horizontal bar charts from reference) */}
            <div className="p-3.5 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-nasa-orange" />
                  <span>TOP WILDFIRE REGIONS</span>
                </span>
                <span className="text-[9px] text-slate-400">DETECTIONS</span>
              </div>

              {/* Horizontal Bar Chart Items */}
              <div className="space-y-2 text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span className="font-bold">1. Central African Savanna</span>
                    <span className="text-nasa-orange font-bold">985</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-nasa-orange rounded-full w-[92%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span className="font-bold">2. South American Cerrado</span>
                    <span className="text-nasa-orange font-bold">742</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-nasa-orange to-red-500 rounded-full w-[78%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span className="font-bold">3. Indo-Gangetic Basin</span>
                    <span className="text-nasa-cyan font-bold">490</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-nasa-cyan rounded-full w-[56%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span className="font-bold">4. SE Asian Highlands</span>
                    <span className="text-sky-300 font-bold">365</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-sky-300 rounded-full w-[42%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span className="font-bold">5. Australian Outback</span>
                    <span className="text-slate-300 font-bold">260</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-slate-400 to-blue-400 rounded-full w-[32%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: 4 Circular Radial Gauges (Directly inspired by reference screenshot) */}
            <div className="p-3.5 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                <span className="text-nasa-cyan font-bold flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DETECTION & SENSOR GAUGES</span>
                </span>
                <span className="text-[9px] text-slate-400">RATIO</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <RadialGauge
                  percentage={61}
                  label="VIIRS 375M"
                  sublabel="High-Res Pass"
                  color="#ff9100"
                />
                <RadialGauge
                  percentage={39}
                  label="MODIS 1KM"
                  sublabel="Multi-Band"
                  color="#00e5ff"
                />
                <RadialGauge
                  percentage={88}
                  label="CONFIDENCE"
                  sublabel=">80% Threshold"
                  color="#10b981"
                />
                <RadialGauge
                  percentage={55}
                  label="DAYTIME"
                  sublabel="Solar Corrected"
                  color="#f59e0b"
                />
              </div>
            </div>

            {/* Card 3: Radiative Power Breakdown */}
            <div className="p-3 rounded-xl bg-space-950/85 border border-nasa-cyan/25 backdrop-blur-md font-mono space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-nasa-orange font-bold text-[11px] flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-nasa-orange" />
                  <span>FIRMS ALGORITHM INTEGRITY</span>
                </span>
                <span className="text-[9px] text-emerald-400">VERIFIED</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Thermal anomalies filtered through bidirectional cloud-masking & solar glint rejection protocols.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. BOTTOM TELEMETRY STATUS BAR ================= */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 rounded-xl bg-space-950/80 border border-nasa-cyan/20 backdrop-blur-md text-[10px] font-mono text-slate-400 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-nasa-cyan">
            <Satellite className="w-3.5 h-3.5" />
            <span className="font-bold">CONSTELLATION:</span>
            <span className="text-white">TERRA (MODIS) // AQUA (MODIS) // SUOMI-NPP (VIIRS) // NOAA-20 (VIIRS)</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>LATENCY: 42 MS</span>
          <span className="text-slate-600">//</span>
          <span className="text-emerald-400">DATA INTEGRITY: 100% NOMINAL</span>
        </div>
      </footer>
    </div>
  );
};

