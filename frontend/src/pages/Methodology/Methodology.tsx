import React from 'react';
import {
  Satellite,
  Flame,
  Info,
  ShieldAlert,
  Cpu,
  BookOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const Methodology: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 font-sans">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2 text-nasa-cyan text-xs font-mono mb-1.5">
          <BookOpen className="w-4 h-4" />
          <span>SCIENTIFIC PRINCIPLES & METHODOLOGY // NASA FIRMS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Data Architecture & Scientific Methodology
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          An overview of the physics, satellite radiometry algorithms, Fire Radiative Power formulations, and operational limitations governing FireSync's Earth observation intelligence.
        </p>
      </div>

      {/* Section 1: Radiometric Detection Physics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-nasa-orange" />
            <span>Thermal Infrared Active Fire Detection</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Wildfire detection relies on the Planck Radiation Law. Typical ambient Earth surfaces radiate peak thermal energy in the longwave infrared spectrum (~10–12 µm) at approximately 300 Kelvin. Actively flaming vegetation burns between 800 K and 1,200 K, dramatically shifting its peak spectral radiant emittance toward the middle-infrared (MIR) atmospheric window at 3.7–4.0 µm.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            By monitoring the differential brightness temperature between the mid-infrared channels (~3.9 µm) and thermal longwave channels (~11.0 µm), NASA algorithms detect sub-pixel flaming hotspots even when the fire occupies less than 0.1% of the total pixel footprint.
          </p>

          <div className="p-4 rounded-xl bg-space-950 border border-nasa-cyan/30 font-mono text-xs space-y-2">
            <div className="text-nasa-cyan font-bold">Wien's Displacement Law:</div>
            <div className="text-slate-200">
              {'λ_max = 2898 µm·K / T'}
            </div>
            <div className="text-slate-400 text-[11px]">
              • Ambient Earth (T ≈ 300 K): λ_max ≈ 9.6 µm (Thermal IR)<br />
              • Flaming Wildfire (T ≈ 1000 K): λ_max ≈ 2.9 µm (Middle IR)
            </div>
          </div>
        </div>

        {/* Spacecraft Constellations Card */}
        <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-nasa-cyan" />
              <span>Constellation Orbits</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sun-synchronous polar orbits provide global twice-daily coverage per spacecraft:
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-space-850 border border-white/5">
              <div className="text-nasa-cyan font-bold">TERRA (EOS AM-1)</div>
              <div className="text-slate-400 text-[11px]">Descending node: 10:30 AM local time</div>
            </div>
            <div className="p-3 rounded-lg bg-space-850 border border-white/5">
              <div className="text-nasa-cyan font-bold">AQUA (EOS PM-1)</div>
              <div className="text-slate-400 text-[11px]">Ascending node: 1:30 PM local time</div>
            </div>
            <div className="p-3 rounded-lg bg-space-850 border border-white/5">
              <div className="text-nasa-orange font-bold">SUOMI-NPP & NOAA-20</div>
              <div className="text-slate-400 text-[11px]">Afternoon orbit: 1:30 PM / 1:20 PM local time</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-white/10 pt-3">
            Combined repeat cycle captures the diurnal afternoon fire peak.
          </div>
        </div>
      </div>

      {/* Section 2: Fire Radiative Power (FRP) Mathematical Formulation */}
      <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4 font-mono">
        <div className="flex items-center space-x-2 text-amber-400">
          <Cpu className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white font-sans">
            Fire Radiative Power (FRP) Retrieval Model
          </h2>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Fire Radiative Power (FRP), expressed in Megawatts (MW), measures the instantaneous rate of electromagnetic energy emitted by biomass combustion. Kaufman and Wooster demonstrated that radiant energy emitted in the 4 µm window is directly proportional to the combustion rate of dry biomass:
        </p>

        <div className="p-5 rounded-xl bg-space-950 border border-white/15 text-slate-200 text-sm space-y-2">
          <div className="text-amber-300 font-bold">Wooster Mid-Infrared Radiance Formulation:</div>
          <div className="text-base text-white font-mono">
            {'FRP = (A_pix · σ / a) · (L_MIR,fire - L_MIR,bg)'}
          </div>
          <div className="text-xs text-slate-400 font-sans mt-2 space-y-1">
            <p>• A_pix = Ground pixel projection area (m²)</p>
            <p>• σ = Stefan-Boltzmann constant (5.67 × 10⁻⁸ W·m⁻²·K⁻⁴)</p>
            <p>• a = Sensor spectral calibration constant</p>
            <p>• (L_MIR,fire - L_MIR,bg) = Differential radiant radiance emitted by active flaming front</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-space-850 border border-white/10 text-xs text-slate-300 font-sans">
          <span className="font-bold text-white">Biomass Combustion Translation:</span> FRP provides a direct quantitative link to fuel consumption. An empirical conversion factor of 0.368 ± 0.015 kg/MJ translates integrated Fire Radiative Energy (FRE) directly into total combusted biomass and resultant greenhouse gas / aerosol emissions.
        </div>
      </div>

      {/* Section 3: Limitations & Scientific Integrity */}
      <div className="p-6 rounded-2xl bg-space-900/80 border border-rose-500/20 backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-2 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">
            Data Limitations & Operational Caveats
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In alignment with NASA FIRMS protocols, FireSync transparently identifies the fundamental limits of spaceborne thermal radiometry:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-2">
          <div className="p-4 rounded-xl bg-space-950/80 border border-white/10">
            <div className="text-white font-bold mb-1">CLOUD OBSCURATION</div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              Dense meteorological cloud cover and thick pyrocumulonimbus plumes completely attenuate 3.9 µm radiation, preventing satellites from observing fires burning beneath.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950/80 border border-white/10">
            <div className="text-white font-bold mb-1">TEMPORAL SAMPLING GAP</div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              Low Earth orbit polar satellites provide snapshots only during overpass times (typically 10:30 AM and 1:30 PM). Fast-moving grass fires igniting and extinguishing between passes may be unrecorded.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950/80 border border-white/10">
            <div className="text-white font-bold mb-1">FALSE ANOMALIES</div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              High-reflectance solar glint, volcanic thermal vents, industrial blast furnaces, and oil refinery gas flares can trigger thermal anomalies. FireSync marks known non-vegetation anomalies where verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
