import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Satellite,
  Activity,
  Globe2,
  Cpu,
  Orbit,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Radio,
  Thermometer,
} from 'lucide-react';
import { SATELLITE_DATA, type SatelliteInfo } from './satelliteData';
import { Link } from 'react-router-dom';

interface SatelliteInfoCardProps {
  satelliteId: 'MODIS' | 'VIIRS';
  onSelectSatellite: (id: 'MODIS' | 'VIIRS') => void;
  onClose: () => void;
}

export const SatelliteInfoCard: React.FC<SatelliteInfoCardProps> = ({
  satelliteId,
  onSelectSatellite,
  onClose,
}) => {
  const data: SatelliteInfo = SATELLITE_DATA[satelliteId];

  return (
    <motion.div
      key={satelliteId}
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-xl rounded-2xl bg-space-950/90 border border-white/20 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 space-y-5 text-white font-mono pointer-events-auto overflow-hidden"
      style={{
        boxShadow: `0 0 50px -10px ${data.accentColor}35`,
      }}
    >
      {/* Subtle top accent edge */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${data.accentColor}, transparent)`,
        }}
      />

      {/* Header with Satellite Switcher and Close Button */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        {/* Toggle between MODIS and VIIRS */}
        <div className="flex items-center space-x-2 bg-space-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onSelectSatellite('MODIS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              satelliteId === 'MODIS'
                ? 'bg-nasa-cyan text-space-950 shadow-glow-cyan/50 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>MODIS (1KM)</span>
          </button>
          <button
            onClick={() => onSelectSatellite('VIIRS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              satelliteId === 'VIIRS'
                ? 'bg-nasa-orange text-white shadow-glow-orange font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>VIIRS (375M)</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer group"
          title="Return to Space Orbit"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Title & Status with Satellite Image Badge */}
      <div className="flex items-center space-x-4">
        <div
          className="relative w-20 h-14 rounded-xl border flex items-center justify-center p-1 bg-space-900/90 overflow-hidden shrink-0"
          style={{
            borderColor: `${data.accentColor}50`,
            boxShadow: `0 0 20px -4px ${data.accentColor}30`,
          }}
        >
          <img
            src={`/satellites/${satelliteId === 'MODIS' ? 'modis.png' : 'viirs.png'}`}
            alt={data.instrumentName}
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: data.accentColor }}
            />
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: data.accentColor }}
            >
              {data.missionStatus}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans leading-tight">
            {data.instrumentName}
          </h3>
          <p className="text-xs text-slate-300 font-sans">
            Spacecraft: <span className="text-white font-semibold">{data.spacecraft}</span>
          </p>
        </div>
      </div>

      {/* Primary Telemetry Specs Matrix (2x3 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Orbit className="w-3 h-3 text-nasa-cyan" />
            <span>ALTITUDE</span>
          </div>
          <div className="font-bold text-white text-xs">{data.altitude}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Activity className="w-3 h-3 text-nasa-orange" />
            <span>RESOLUTION</span>
          </div>
          <div className="font-bold text-white text-xs">{data.spatialResolution}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Thermometer className="w-3 h-3 text-emerald-400" />
            <span>CRYO DEWAR</span>
          </div>
          <div className="font-bold text-emerald-400 text-xs">{data.sensorTemp}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Radio className="w-3 h-3 text-amber-400" />
            <span>SWATH WIDTH</span>
          </div>
          <div className="font-bold text-white text-xs">{data.swathWidth}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>SPECTRAL BANDS</span>
          </div>
          <div className="font-bold text-white text-xs">{data.spectralBands}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/80 border border-white/10">
          <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-1">
            <Globe2 className="w-3 h-3 text-purple-400" />
            <span>INCLINATION</span>
          </div>
          <div className="font-bold text-white text-xs">{data.inclination}</div>
        </div>
      </div>

      {/* Description / Mission Scope */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-sans leading-relaxed">
        {data.description}
      </div>

      {/* Action Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
        <button
          onClick={onClose}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <span>✕ RETURN TO ORBIT</span>
        </button>

        <Link
          to="/satellites"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-nasa-blue to-nasa-cyan hover:shadow-glow-cyan text-xs font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
        >
          <span>FULL RADIOMETRIC SPECS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};

