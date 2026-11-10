import React, { useState } from 'react';
import {
  Satellite,
  Flame,
  CheckCircle2,
  Sliders,
  Eye,
  Zap,
  Grid,
  Info,
  Layers,
  ArrowRight,
  Orbit,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SatelliteViewer3D } from '../../components/satellites/SatelliteViewer3D';

const comparisonSpecs = [
  {
    parameter: 'Spatial Resolution (Nadir)',
    modis: '1,000 meters (1 km)',
    viirs: '375 meters (I-Band)',
    advantage: 'VIIRS (approx. 7x finer areal resolution)',
  },
  {
    parameter: 'Scan Swath Width',
    modis: '2,330 kilometers',
    viirs: '3,060 kilometers (no data gaps)',
    advantage: 'VIIRS (full global coverage daily)',
  },
  {
    parameter: 'Host Spacecraft',
    modis: 'Terra (EOS AM-1) & Aqua (EOS PM-1)',
    viirs: 'Suomi-NPP, NOAA-20 (JPSS-1), NOAA-21',
    advantage: 'Complementary constellations',
  },
  {
    parameter: 'Primary Fire Thermal Band',
    modis: 'Band 21 / 22 (3.96 µm) & Band 31 (11.0 µm)',
    viirs: 'I4 (3.74 µm) & M13 (4.05 µm) & I5 (11.45 µm)',
    advantage: 'VIIRS dual-gain pixel aggregation',
  },
  {
    parameter: 'Small Fire Detection Threshold',
    modis: '~100 m² flaming fire',
    viirs: '~10 - 25 m² flaming fire',
    advantage: 'VIIRS (detects early agricultural & spot fires)',
  },
  {
    parameter: 'Equatorial Overpass (Day)',
    modis: 'Terra: 10:30 AM | Aqua: 1:30 PM',
    viirs: 'Suomi-NPP: 1:30 PM | NOAA-20: 1:20 PM',
    advantage: 'Together provide 4x daily temporal revisit',
  },
  {
    parameter: 'Fire Radiative Power (FRP) Source',
    modis: 'Kaufman / Wooster MIR radiance formulation',
    viirs: 'Dual-gain M13 channel radiance integration',
    advantage: 'Scientific continuity across 20+ years',
  },
];

const detectionComparisonData = [
  { category: 'Amazon Basin', modis: 420, viirs: 1140 },
  { category: 'Southern Africa', modis: 890, viirs: 2450 },
  { category: 'Indo-Gangetic', modis: 310, viirs: 920 },
  { category: 'Northern Australia', modis: 280, viirs: 710 },
  { category: 'Boreal Canada', modis: 190, viirs: 480 },
];

export const SatelliteComparison: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3d-inspect' | 'specs' | 'pixel-sim' | 'charts'>('3d-inspect');
  const [simFireSpread, setSimFireSpread] = useState<number>(45);

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2 text-nasa-cyan text-xs font-mono mb-1.5">
          <Satellite className="w-4 h-4" />
          <span>SCIENTIFIC INSTRUMENT COMPARISON // SATELLITE SENSORS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          MODIS vs. VIIRS Radiometry
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Understanding the complementary capabilities, spatial resolutions, and temporal coverage of NASA's Moderate Resolution Imaging Spectroradiometer (MODIS) and Visible Infrared Imaging Radiometer Suite (VIIRS).
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-6">
          <button
            onClick={() => setActiveTab('3d-inspect')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === '3d-inspect'
                ? 'bg-nasa-cyan text-space-950 font-bold shadow-glow-cyan/30'
                : 'bg-space-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>3D SATELLITE INSPECTION</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-nasa-blue text-white shadow-sm font-bold'
                : 'bg-space-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            SPECIFICATIONS MATRIX
          </button>
          <button
            onClick={() => setActiveTab('pixel-sim')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'pixel-sim'
                ? 'bg-nasa-blue text-white shadow-sm font-bold'
                : 'bg-space-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            PIXEL FOOTPRINT SIMULATOR (1km vs 375m)
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-nasa-blue text-white shadow-sm font-bold'
                : 'bg-space-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            DETECTION YIELD BENCHMARKS
          </button>
        </div>
      </div>

      {/* TAB 0: 3D Satellite Inspector (Object on Left, Info on Right) */}
      {activeTab === '3d-inspect' && (
        <SatelliteViewer3D />
      )}

      {/* TAB 1: Specifications Matrix */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* Constellation Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {/* MODIS Card */}
            <div className="p-6 rounded-2xl bg-space-900/80 border border-nasa-cyan/30 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs px-2.5 py-1 rounded bg-nasa-cyan/10 text-nasa-cyan border border-nasa-cyan/20">
                  NASA FLAGSHIP SENSOR
                </span>
                <span className="text-xs text-slate-400">LAUNCH: 1999 (Terra) / 2002 (Aqua)</span>
              </div>
              <h3 className="text-2xl font-bold text-white">MODIS (Terra & Aqua)</h3>
              <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                The historic benchmark of modern spaceborne wildfire intelligence. Over 24 consecutive years of continuous global climate records and fire emissions data.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mt-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">PIXEL SIZE</p>
                  <p className="text-white font-bold">1,000 m</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">SWATH</p>
                  <p className="text-white font-bold">2,330 km</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">BANDS</p>
                  <p className="text-white font-bold">36 Channels</p>
                </div>
              </div>
            </div>

            {/* VIIRS Card */}
            <div className="p-6 rounded-2xl bg-space-900/80 border border-nasa-orange/30 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs px-2.5 py-1 rounded bg-nasa-orange/10 text-nasa-orange border border-nasa-orange/20">
                  NEXT-GEN HIGH RESOLUTION
                </span>
                <span className="text-xs text-slate-400">LAUNCH: 2011 (S-NPP) / 2017 (NOAA-20)</span>
              </div>
              <h3 className="text-2xl font-bold text-white">VIIRS (S-NPP & NOAA-20)</h3>
              <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                Featuring the revolutionary 375m I-Band thermal channel with active pixel edge aggregation, delivering unprecedented fidelity on fire perimeters and spot fires.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mt-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">PIXEL SIZE</p>
                  <p className="text-nasa-orange font-bold">375 m</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">SWATH</p>
                  <p className="text-nasa-orange font-bold">3,060 km</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">COVERAGE</p>
                  <p className="text-nasa-orange font-bold">No Swath Gap</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Specs Table */}
          <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md overflow-x-auto font-mono text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-semibold">SCIENTIFIC METRIC</th>
                  <th className="pb-3 font-semibold text-nasa-cyan">MODIS (TERRA/AQUA)</th>
                  <th className="pb-3 font-semibold text-nasa-orange">VIIRS (S-NPP/NOAA-20)</th>
                  <th className="pb-3 font-semibold text-slate-300">OPERATIONAL ADVANTAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonSpecs.map((item, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-medium text-white">{item.parameter}</td>
                    <td className="py-3.5 text-slate-300">{item.modis}</td>
                    <td className="py-3.5 text-slate-200">{item.viirs}</td>
                    <td className="py-3.5 text-emerald-400 font-medium flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.advantage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Pixel Footprint Simulator */}
      {activeTab === 'pixel-sim' && (
        <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Grid className="w-5 h-5 text-nasa-cyan" />
                <span>Spatial Footprint Resolution Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing how a real-world wildfire front intersects with a 1,000m MODIS pixel versus 375m VIIRS pixels.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-400">FIRE FRONT INTENSITY:</span>
              <input
                type="range"
                min="20"
                max="80"
                value={simFireSpread}
                onChange={(e) => setSimFireSpread(Number(e.target.value))}
                className="w-32 accent-nasa-orange cursor-pointer"
              />
              <span className="text-nasa-orange font-bold">{simFireSpread}%</span>
            </div>
          </div>

          {/* Side by side comparison simulator visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MODIS 1km Grid */}
            <div className="p-5 rounded-xl bg-space-950 border border-nasa-cyan/30 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-3">
                <span className="text-nasa-cyan font-bold">MODIS 1km Grid (Single Pixel)</span>
                <span className="text-slate-400">Area: 1,000,000 m²</span>
              </div>

              {/* 1km single cell with wildfire sub-pixel combustion */}
              <div className="w-64 h-64 border-2 border-nasa-cyan relative rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                {/* Fire burning inside */}
                <div
                  className="rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-300 blur-sm shadow-glow-orange transition-all duration-300"
                  style={{
                    width: `${simFireSpread}%`,
                    height: `${simFireSpread}%`,
                  }}
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-mono text-nasa-cyan/80">
                  Sub-pixel flame area: {(simFireSpread * 100).toFixed(0)} m²
                </span>
                <span className="absolute top-2 right-2 text-[10px] font-mono text-slate-400">
                  Entire 1km² flagged as 1 hotspot
                </span>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3 font-sans max-w-xs">
                In MODIS, a small spot fire flags the entire 1,000m pixel, making precise fireline boundaries harder to resolve.
              </p>
            </div>

            {/* VIIRS 375m Grid */}
            <div className="p-5 rounded-xl bg-space-950 border border-nasa-orange/30 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-3">
                <span className="text-nasa-orange font-bold">VIIRS 375m Grid (Subdivided Pixels)</span>
                <span className="text-slate-400">~7x Pixel Density</span>
              </div>

              {/* 3x3 subdivided grid representing the same physical ground area */}
              <div className="w-64 h-64 border-2 border-nasa-orange/50 relative rounded-lg overflow-hidden grid grid-cols-3 grid-rows-3 gap-0.5 bg-space-900 p-0.5">
                {Array.from({ length: 9 }).map((_, i) => {
                  const isBurning = i === 4 || (i === 1 && simFireSpread > 40) || (i === 3 && simFireSpread > 60);
                  return (
                    <div
                      key={i}
                      className={`relative rounded border border-white/10 flex items-center justify-center transition-colors duration-300 ${
                        isBurning ? 'bg-orange-600/40 border-nasa-orange shadow-glow-orange/30' : 'bg-slate-900/60'
                      }`}
                    >
                      {isBurning && (
                        <Flame className="w-5 h-5 text-nasa-orange animate-pulse" />
                      )}
                      <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-slate-500">
                        375m
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 text-center mt-3 font-sans max-w-xs">
                VIIRS pinpoints exactly which sub-quadrants are active, outlining precise fire perimeters and spot spread directions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Detection Yield Benchmark Charts */}
      {activeTab === 'charts' && (
        <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md space-y-4">
          <h3 className="text-xl font-bold text-white">Comparative Detection Count by Biome</h3>
          <p className="text-xs text-slate-400">
            Due to 375m resolution, VIIRS consistently detects between 2.5x to 3x more distinct active fire pixels than MODIS across all continental ecosystems.
          </p>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detectionComparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} fontFamily="monospace" />
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
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="modis" name="MODIS (1km)" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="viirs" name="VIIRS (375m)" fill="#ff5722" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

