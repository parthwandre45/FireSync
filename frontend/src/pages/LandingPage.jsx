import React from 'react';
import { 
  Flame, 
  Satellite, 
  Layers, 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Globe2, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Clock,
  Compass,
  Cpu,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { DemoBadge } from '../components/common/DemoBadge';

export const LandingPage = ({ onLaunchApp, onSelectModule }) => {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-fire-600 selection:text-white">
      
      {/* 1. Top Navigation */}
      <nav className="border-b border-slate-850 bg-space-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fire-600 via-fire-500 to-amber-500 flex items-center justify-center shadow-lg shadow-fire-600/30">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  FireSync
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-nasa-blue/40 text-nasa-cyan border border-nasa-cyan/30">
                  NASA Space Apps 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Unified Satellite Fire Intelligence
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">Overview</a>
            <a href="#sensors" className="hover:text-white transition-colors">MODIS vs VIIRS</a>
            <a href="#methodology" className="hover:text-white transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
            <a href="#firms" className="hover:text-white transition-colors">NASA FIRMS Data</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onLaunchApp}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fire-600 to-amber-500 hover:from-fire-500 hover:to-amber-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-fire-600/25 transition-all duration-200 active:scale-95"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-slate-850">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-fire-600/15 via-nasa-blue/20 to-nasa-cyan/10 blur-[130px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-space-900 border border-slate-700 text-xs font-mono text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-nasa-gold" />
            <span>NASA Space Apps Challenge 2026 Solution</span>
            <span className="text-slate-500">•</span>
            <span className="text-nasa-cyan">Earth Observation Track</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Understand Earth's Burning Patterns.{' '}
            <span className="bg-gradient-to-r from-fire-400 via-amber-300 to-nasa-cyan bg-clip-text text-transparent">
              One Unified View.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            NASA satellites have tracked active wildfires from orbit for over two decades. 
            FireSync eliminates historical sensor bias by harmonizing MODIS and VIIRS observations 
            into a unified, cross-calibrated burning activity calendar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchApp}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-fire-600 via-fire-500 to-amber-500 hover:from-fire-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-fire-600/30 transition-all duration-200 active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onSelectModule('comparison')}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-space-900/90 hover:bg-space-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-sm font-semibold transition-all duration-200"
            >
              <Satellite className="w-4 h-4 text-nasa-cyan" />
              <span>Compare MODIS vs. VIIRS</span>
            </button>

            <button
              onClick={() => onSelectModule('explorer')}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-space-900/90 hover:bg-space-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-sm font-semibold transition-all duration-200"
            >
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Hotspot Explorer</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-mono text-slate-400">Temporal Coverage</div>
              <div className="text-xl font-bold text-white mt-1">2000 – 2026</div>
              <div className="text-[11px] text-slate-400">26-year continuous record</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-mono text-slate-400">Satellite Sensors</div>
              <div className="text-xl font-bold text-white mt-1">5 Orbiters</div>
              <div className="text-[11px] text-slate-400">Terra, Aqua, S-NPP, NOAA-20/21</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-mono text-slate-400">Spatial Resolution</div>
              <div className="text-xl font-bold text-white mt-1">375m & 1km</div>
              <div className="text-[11px] text-slate-400">Harmonized EPSG:4326 grid</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-mono text-slate-400">Cross-Calibration</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">0.942 Index</div>
              <div className="text-[11px] text-slate-400">Consistency confidence</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MODIS and VIIRS Introduction */}
      <section id="sensors" className="py-20 border-b border-slate-850 bg-space-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-fire-400 uppercase tracking-wider font-semibold">
              <Satellite className="w-3.5 h-3.5" />
              <span>Sensor Continuity Problem</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Two Generations of NASA Active Fire Sensors
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Understanding why raw satellite fire counts cannot be directly compared without mathematical cross-calibration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MODIS Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Legacy Gold Standard (Since 2000)
                </span>
                <span className="text-xs font-mono text-slate-400">Terra & Aqua</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">MODIS Active Fire Product</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Moderate Resolution Imaging Spectroradiometer</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Operated aboard NASA's flagship EOS satellites, MODIS pioneered global thermal anomaly tracking. 
                With a nominal footprint of <strong>1,000 meters (1 km)</strong> at nadir, it provides the bedrock 
                benchmark for two decades of climate and wildfire science.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800">
                  <div className="text-slate-400">Pixel Size:</div>
                  <div className="text-white font-bold text-sm">~1.00 km²</div>
                </div>
                <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800">
                  <div className="text-slate-400">Thermal Bands:</div>
                  <div className="text-white font-bold text-sm">Ch 21/22, 31</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>26-year unfragmented global archive</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Robust saturation resistance up to 500 K</span>
                </div>
                <div className="flex items-center space-x-2 text-amber-300">
                  <span className="w-4 text-center font-bold">!</span>
                  <span>Misses sub-pixel cooler fires; swath-edge distortion</span>
                </div>
              </div>
            </div>

            {/* VIIRS Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fire-600/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-fire-500/10 text-fire-400 border border-fire-500/30">
                  Next-Gen High Resolution (Since 2012)
                </span>
                <span className="text-xs font-mono text-slate-400">S-NPP, NOAA-20, NOAA-21</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">VIIRS Active Fire Product</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Visible Infrared Imaging Radiometer Suite</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Operating on joint NASA/NOAA JPSS polar satellites, VIIRS's 375m imagery channels 
                revolutionized fire perimeter detection. By resolving areas <strong>~7x smaller than MODIS</strong>, 
                it detects early ignitions, nighttime flaming fronts, and subtle fire growth.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800">
                  <div className="text-slate-400">Pixel Size:</div>
                  <div className="text-white font-bold text-sm">~0.14 km² (375m)</div>
                </div>
                <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800">
                  <div className="text-slate-400">Thermal Bands:</div>
                  <div className="text-white font-bold text-sm">I4 (3.74μm), I5</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>375m resolution delineates precise fire fronts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Constant resolution across the entire swath</span>
                </div>
                <div className="flex items-center space-x-2 text-amber-300">
                  <span className="w-4 text-center font-bold">!</span>
                  <span>Produces 2.8x more discrete fire pixels than MODIS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How FireSync Works */}
      <section id="methodology" className="py-20 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-nasa-cyan uppercase tracking-wider font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Scientific Processing Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              How FireSync Harmonizes Satellite Observations
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Transforming fragmented raw sensor points into coherent historical burning activity calendars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-space-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-nasa-cyan text-sm">
                01
              </div>
              <h3 className="font-bold text-white text-base">FIRMS Ingestion</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pulls active fire detections from NASA LANCE/FIRMS for Terra, Aqua, S-NPP, NOAA-20, and NOAA-21 in real-time and archival batches.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-space-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-fire-400 text-sm">
                02
              </div>
              <h3 className="font-bold text-white text-base">Geometry Alignment</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Projects sensor points into standard WGS 84 (EPSG:4326) PostGIS geometries, resolving scan and track pixel distortions.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-space-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-nasa-gold text-sm">
                03
              </div>
              <h3 className="font-bold text-white text-base">Spatio-Temporal DBSCAN</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Applies adaptive 1.5 km spatial clustering with a 48-hour temporal window using GeoPandas, Shapely, and NumPy.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-space-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                04
              </div>
              <h3 className="font-bold text-white text-base">Harmonized Calendar</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Synthesizes continuous daily Fire Radiative Energy (FRE), burned area estimates, and cross-sensor consistency scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Project Benefits */}
      <section id="benefits" className="py-20 border-b border-slate-850 bg-space-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Impact & Utility</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Who Benefits from Harmonized Fire Intelligence?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Bridging the gap between raw aerospace telemetry and actionable environmental decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="p-3 w-fit rounded-xl bg-fire-600/10 text-fire-400 border border-fire-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Wildland Fire Incident Commanders</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Get an unbiased historical baseline of fire behavior in their operational zones without confusing instrument changes for true fire regime shifts.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="p-3 w-fit rounded-xl bg-nasa-blue/30 text-nasa-cyan border border-nasa-cyan/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Climate & Earth System Scientists</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Access a normalized, multi-decadal timeline of biomass burning emissions and fire return intervals with rigorous cross-sensor consistency metrics.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="p-3 w-fit rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Forestry & Carbon Policy Planners</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quantify wildfire prevention efficacy and verify carbon credit preservation against accurate historical burning benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NASA FIRMS Data Source Information */}
      <section id="firms" className="py-20 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel-glow p-8 sm:p-12 rounded-3xl border border-slate-700/60 relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-nasa-blue/40 text-nasa-cyan border border-nasa-cyan/30">
                    Data Attribution & Open Science
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified NASA FIRMS Store
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Powered by NASA FIRMS & LANCE
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  FireSync ingests active fire data provided by NASA's Fire Information for Resource Management System (FIRMS), 
                  part of NASA's Earth Observing System Data and Information System (EOSDIS) and Land, Atmosphere Near real-time Capability for EOS (LANCE).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <a
                  href="https://firms.modaps.eosdis.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-space-900 hover:bg-space-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  <span>Visit NASA FIRMS Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-nasa-cyan" />
                </a>

                <button
                  onClick={() => onSelectModule('methodology')}
                  className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-fire-600 hover:bg-fire-500 text-white text-xs font-semibold shadow-md shadow-fire-600/20 transition-all"
                >
                  <span>View Harmonization Schema</span>
                  <FileCheck2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <div>
                <strong className="text-slate-200 block">MODIS MCD14DL / NRT:</strong>
                Terra & Aqua 1km Near Real-Time Active Fire Locations
              </div>
              <div>
                <strong className="text-slate-200 block">VIIRS VNP14IMGTDL_NRT:</strong>
                Suomi-NPP 375m Active Fire Detections
              </div>
              <div>
                <strong className="text-slate-200 block">VIIRS VJ114IMGTDL / VJ214IMG:</strong>
                NOAA-20 and NOAA-21 Joint Polar Satellite System
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 bg-space-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-fire-500" />
            <span className="font-bold text-slate-300">FireSync</span>
            <span>– NASA Space Apps Challenge 2026</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onLaunchApp} className="text-slate-400 hover:text-white transition-colors">
              Open Dashboard
            </button>
            <button onClick={() => onSelectModule('methodology')} className="text-slate-400 hover:text-white transition-colors">
              Methodology
            </button>
            <button onClick={() => onSelectModule('explorer')} className="text-slate-400 hover:text-white transition-colors">
              Hotspots Map
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};