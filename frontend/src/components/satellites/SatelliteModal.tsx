import React from 'react';
import { X, Satellite, Activity, Radio, Globe2, ShieldCheck, Zap, Orbit, ExternalLink } from 'lucide-react';

export interface SatelliteInfo {
  id: 'MODIS' | 'VIIRS';
  fullName: string;
  instrumentName: string;
  spacecraft: string;
  orbitType: string;
  altitude: string;
  inclination: string;
  spatialResolution: string;
  spectralBands: string;
  overpassTime: string;
  missionStatus: string;
  swathWidth: string;
  sensorTemp: string;
  description: string;
  keyRole: string;
  accentColor: string;
}

export const SATELLITE_DATA: Record<'MODIS' | 'VIIRS', SatelliteInfo> = {
  MODIS: {
    id: 'MODIS',
    fullName: 'Moderate Resolution Imaging Spectroradiometer',
    instrumentName: 'MODIS (Terra & Aqua)',
    spacecraft: 'EOS AM-1 (Terra) & EOS PM-1 (Aqua)',
    orbitType: 'Sun-synchronous Near-Polar Low Earth Orbit (LEO)',
    altitude: '705 kilometers (438 miles)',
    inclination: '98.2 degrees',
    spatialResolution: '250m, 500m, and 1,000m (Thermal IR)',
    spectralBands: '36 Spectral Bands (0.4 µm to 14.4 µm)',
    overpassTime: 'Terra: 10:30 AM (Descending) | Aqua: 1:30 PM (Ascending)',
    missionStatus: 'ACTIVE // NOMINAL TELEMETRY',
    swathWidth: '2,330 km (Daily Global Revisit)',
    sensorTemp: '85.2 K (Active Passive Radiator Cryocooled)',
    description:
      'MODIS is a key NASA instrument aboard the Terra and Aqua satellites. For over 24 consecutive years, it has provided continuous global wildfire hotspot detection and Fire Radiative Power (FRP) measurements using 4 µm and 11 µm mid-infrared radiometry.',
    keyRole: 'Benchmark decadal climate baseline, regional wildfire tracking, and total biomass combustion estimates.',
    accentColor: '#00e5ff',
  },
  VIIRS: {
    id: 'VIIRS',
    fullName: 'Visible Infrared Imaging Radiometer Suite',
    instrumentName: 'VIIRS (Suomi-NPP & NOAA-20)',
    spacecraft: 'Suomi-NPP (SNPP) & JPSS-1 (NOAA-20)',
    orbitType: 'Sun-synchronous Polar Low Earth Orbit (LEO)',
    altitude: '824 kilometers (512 miles)',
    inclination: '98.7 degrees',
    spatialResolution: '375m (I-Bands High Resolution) & 750m (M-Bands)',
    spectralBands: '22 Imaging and Radiometric Bands',
    overpassTime: '1:30 PM Local Solar Time (Afternoon Constellation)',
    missionStatus: 'ACTIVE // HIGH-RESOLUTION STREAM',
    swathWidth: '3,060 km (Full Global Daily Coverage with No Nadir Gap)',
    sensorTemp: '80.0 K (Stirling Cryocooled Dewar)',
    description:
      'VIIRS is the next-generation Earth-observation scanning radiometer aboard NOAA/NASA Joint Polar Satellite System spacecraft. Its flagship 375m I-Band active fire algorithm resolves firelines with 7x finer areal resolution than MODIS, detecting spot fires as small as 10–25 m².',
    keyRole: 'High-precision wildfire perimeter mapping, early ignition detection, and nighttime thermal anomaly reconnaissance.',
    accentColor: '#ff5722',
  },
};

interface SatelliteModalProps {
  satelliteId: 'MODIS' | 'VIIRS' | null;
  onClose: () => void;
}

export const SatelliteModal: React.FC<SatelliteModalProps> = ({ satelliteId, onClose }) => {
  if (!satelliteId) return null;

  const data = SATELLITE_DATA[satelliteId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/75 backdrop-blur-md animate-fade-in font-mono">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-space-900 border border-white/20 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
        style={{
          boxShadow: `0 0 50px -10px ${data.accentColor}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-3 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${data.accentColor}15`,
                borderColor: `${data.accentColor}40`,
                color: data.accentColor,
              }}
            >
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {data.id} Spacecraft Telemetry
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${data.accentColor}15`,
                    borderColor: `${data.accentColor}40`,
                    color: data.accentColor,
                  }}
                >
                  NASA / NOAA
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">{data.fullName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-space-850 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Satellite Telemetry Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-space-950 border border-white/10 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">{data.missionStatus}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>SENSOR TEMP: <strong className="text-white">{data.sensorTemp}</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Orbit className="w-3.5 h-3.5 text-nasa-orange" />
            <span>ALTITUDE: <strong className="text-white">{data.altitude}</strong></span>
          </div>
        </div>

        {/* Scientific Mission Overview */}
        <div className="text-xs text-slate-300 font-sans leading-relaxed space-y-2">
          <p>{data.description}</p>
          <div className="p-3 rounded-lg bg-space-850/80 border border-white/10 font-mono text-xs">
            <span className="font-bold text-white">PRIMARY SCIENTIFIC ROLE: </span>
            <span className="text-slate-300 font-sans">{data.keyRole}</span>
          </div>
        </div>

        {/* Orbit & Instrument Specifications Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-space-850 border border-white/5">
            <span className="text-[10px] text-slate-400">HOST SPACECRAFT</span>
            <p className="font-semibold text-white mt-0.5">{data.spacecraft}</p>
          </div>
          <div className="p-3 rounded-xl bg-space-850 border border-white/5">
            <span className="text-[10px] text-slate-400">SPATIAL RESOLUTION</span>
            <p
              className="font-bold mt-0.5"
              style={{ color: data.accentColor }}
            >
              {data.spatialResolution}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-space-850 border border-white/5">
            <span className="text-[10px] text-slate-400">SPECTRAL CHANNELS</span>
            <p className="font-semibold text-white mt-0.5">{data.spectralBands}</p>
          </div>
          <div className="p-3 rounded-xl bg-space-850 border border-white/5">
            <span className="text-[10px] text-slate-400">SWATH WIDTH</span>
            <p className="font-semibold text-white mt-0.5">{data.swathWidth}</p>
          </div>
          <div className="p-3 rounded-xl bg-space-850 border border-white/5 sm:col-span-2">
            <span className="text-[10px] text-slate-400">ORBITAL OVERPASS SCHEDULE</span>
            <p className="font-semibold text-white mt-0.5">{data.overpassTime}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <a
            href="/satellites"
            className="inline-flex items-center space-x-1.5 text-nasa-cyan hover:underline"
          >
            <span>Compare MODIS vs. VIIRS in detail</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

