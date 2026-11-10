import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import {
  Flame,
  Satellite,
  Compass,
  ArrowRight,
  Activity,
  Layers,
  ChevronDown,
  Globe2,
  Cpu,
  Orbit,
} from 'lucide-react';
import { EarthScene } from '../../components/earth/EarthScene';
import { SatelliteInfoCard } from '../../components/satellites/SatelliteInfoCard';
import { GlobalWildfireDashboard } from '../../components/dashboard/GlobalWildfireDashboard';

export const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedSatellite, setSelectedSatellite] = useState<'MODIS' | 'VIIRS' | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Track overall scroll progress through container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setScrollProgress(latest);
    });
  }, [scrollYProgress]);

  // Smooth scroll helper functions
  const scrollToSection2 = () => {
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: maxScroll * 0.54,
      behavior: 'smooth',
    });
  };

  const scrollToSection3 = () => {
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: maxScroll,
      behavior: 'smooth',
    });
  };

  const scrollToHero = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Automatic smooth scroll animation on gentle wheel or swipe gesture
  useEffect(() => {
    let isAutoScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (selectedSatellite || isAutoScrolling) return;

      const currentScrollY = window.scrollY;
      const maxScroll =
        (containerRef.current?.scrollHeight || window.innerHeight * 4.2) - window.innerHeight;
      if (maxScroll <= 0) return;

      const currentProgress = currentScrollY / maxScroll;

      // User scrolls down slightly from Hero -> smoothly glide to Section 2
      if (e.deltaY > 15 && currentProgress < 0.20) {
        e.preventDefault();
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll * 0.54,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      }
      // User scrolls down from Section 2 -> smoothly glide to Section 3 (Global Dashboard)
      else if (e.deltaY > 15 && currentProgress >= 0.44 && currentProgress < 0.68) {
        e.preventDefault();
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      }
      // User scrolls up from Section 3 -> smoothly glide back to Section 2
      else if (e.deltaY < -15 && currentProgress > 0.82) {
        e.preventDefault();
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll * 0.54,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      }
      // User scrolls up from Section 2 -> smoothly glide back to Hero
      else if (e.deltaY < -15 && currentProgress >= 0.40 && currentProgress <= 0.68) {
        e.preventDefault();
        isAutoScrolling = true;
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      }
    };

    // Touch gesture support for mobile/touchpads
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (selectedSatellite || isAutoScrolling) return;
      const deltaY = touchStartY - e.touches[0].clientY;
      const currentScrollY = window.scrollY;
      const maxScroll =
        (containerRef.current?.scrollHeight || window.innerHeight * 4.2) - window.innerHeight;
      if (maxScroll <= 0) return;

      const currentProgress = currentScrollY / maxScroll;

      if (deltaY > 30 && currentProgress < 0.20) {
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll * 0.54,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      } else if (deltaY > 30 && currentProgress >= 0.44 && currentProgress < 0.68) {
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      } else if (deltaY < -30 && currentProgress > 0.82) {
        isAutoScrolling = true;
        window.scrollTo({
          top: maxScroll * 0.54,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      } else if (deltaY < -30 && currentProgress >= 0.40 && currentProgress <= 0.68) {
        isAutoScrolling = true;
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isAutoScrolling = false;
        }, 1200);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [selectedSatellite]);

  // Phase opacities across 3 sections:
  // 1. Hero text opacity
  const heroOpacity = Math.max(0, 1 - scrollProgress * 5.2);
  const heroTranslateY = -scrollProgress * 120;

  // 2. Mid-zoom telemetry badge (visible between 0.22 and 0.45)
  const zoomBadgeOpacity =
    scrollProgress > 0.22 && scrollProgress < 0.45
      ? Math.min(1, Math.sin(((scrollProgress - 0.22) / 0.23) * Math.PI))
      : 0;

  // 3. Section 2 content ("MONITOR THE PLANET. DETECT THE UNSEEN.")
  // Fades in at 0.44, holds full opacity 0.52 to 0.68, smoothly fades out by 0.78 as Earth glides to center!
  let section2Opacity = 0;
  if (scrollProgress >= 0.44 && scrollProgress <= 0.68) {
    section2Opacity = Math.min(1, (scrollProgress - 0.44) / 0.08);
  } else if (scrollProgress > 0.68 && scrollProgress <= 0.78) {
    section2Opacity = Math.max(0, 1 - (scrollProgress - 0.68) / 0.09);
  }
  const section2TranslateY = Math.max(0, (1 - Math.min(1, (scrollProgress - 0.44) / 0.12)) * 36);

  // 4. Section 3 Command Center Dashboard
  // Begins fading in at 0.72 as Earth slides to center, reaches 100% full opacity by 0.84 and holds to 1.0!
  const section3Opacity = Math.min(1, Math.max(0, (scrollProgress - 0.72) / 0.12));

  return (
    <div ref={containerRef} className="relative min-h-[420vh] bg-space-950 text-white">
      {/* Persistent Sticky 3D Earth Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <EarthScene
          scrollProgress={scrollProgress}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={(id) => setSelectedSatellite(id)}
          isMapExpanded={isMapExpanded}
        />

        {/* Subtle cinematic radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,4,10,0.75)_100%)] pointer-events-none" />

        {/* Phase 2 Zoom Telemetry HUD Overlay (Appears during planetary descent) */}
        {zoomBadgeOpacity > 0.05 && (
          <div
            style={{ opacity: zoomBadgeOpacity }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 transition-opacity duration-300"
          >
            <div className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-space-950/80 border border-nasa-cyan/40 backdrop-blur-md text-xs font-mono text-nasa-cyan shadow-glow-cyan/20">
              <Orbit className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="tracking-widest">ORBITAL DESCENT // MODIS & VIIRS SENSOR LOCK</span>
            </div>
          </div>
        )}

        {/* Section 3 Global Wildfire Intelligence Dashboard Overlay */}
        <GlobalWildfireDashboard
          opacity={selectedSatellite ? 0 : section3Opacity}
          isMapExpanded={isMapExpanded}
          onToggleMapExpand={() => setIsMapExpanded(!isMapExpanded)}
        />
      </div>

      {/* Floating Content Overlays */}
      <div className="relative -mt-[100vh] z-10 pointer-events-none">
        {/* ================= PHASE 1: HERO SECTION ================= */}
        <section className="h-screen w-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-24 pointer-events-none">
          {/* Top Tagline / Mission Status */}
          <motion.div
            style={{
              opacity: selectedSatellite ? 0 : heroOpacity,
              transform: `translateY(${heroTranslateY * 0.5}px)`,
            }}
            className="flex items-center justify-between pointer-events-auto transition-opacity duration-300"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-nasa-blue/20 border border-nasa-cyan/30 text-nasa-cyan text-xs font-mono tracking-widest backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-nasa-cyan animate-ping" />
              <span>NASA EARTH OBSERVING SYSTEM (EOS) FEEDS ACTIVE</span>
            </div>

            {/* Interactive Spacecraft Quick Toggles */}
            <div className="hidden md:flex items-center space-x-4 text-xs font-mono text-slate-400">
              <button
                onClick={() => setSelectedSatellite('MODIS')}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-nasa-cyan/20 hover:text-nasa-cyan border border-white/10 transition-colors cursor-pointer"
              >
                <Satellite className="w-3.5 h-3.5 text-nasa-cyan" />
                <span>MODIS TERRA / AQUA</span>
              </button>
              <button
                onClick={() => setSelectedSatellite('VIIRS')}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-nasa-orange/20 hover:text-nasa-orange border border-white/10 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                <span>VIIRS 375M I-BAND</span>
              </button>
            </div>
          </motion.div>

          {/* Center Hero Headline */}
          <div className="max-w-xl lg:max-w-xl xl:max-w-2xl my-auto pointer-events-auto">
            <motion.div
              style={{
                opacity: selectedSatellite ? 0 : heroOpacity,
                transform: `translateY(${heroTranslateY}px)`,
              }}
              className="space-y-6 transition-opacity duration-300"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                SEE THE FIRE.<br />
                <span className="bg-gradient-to-r from-nasa-cyan via-sky-300 to-nasa-orange bg-clip-text text-transparent">
                  UNDERSTAND THE PLANET.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-light max-w-lg leading-relaxed">
                Satellite-powered wildfire intelligence for a changing world.
                Continuous global thermal anomaly observation via MODIS and VIIRS satellite sensors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-nasa-blue to-nasa-cyan text-white font-medium text-sm hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore FireSync</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/hotspots"
                  className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-space-900/80 border border-white/15 text-slate-200 font-medium text-sm hover:bg-white/10 hover:border-nasa-cyan/40 transition-all duration-300 backdrop-blur-md"
                >
                  <Globe2 className="w-4 h-4 text-nasa-cyan" />
                  <span>Explore the Data</span>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Bottom Telemetry Bar & Scroll Prompt */}
          <motion.div
            style={{
              opacity: selectedSatellite ? 0 : heroOpacity,
              transform: `translateY(${heroTranslateY * 0.4}px)`,
            }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto transition-opacity duration-300"
          >
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 sm:gap-10 font-mono">
              <div>
                <p className="text-[10px] text-slate-400 tracking-wider">ACTIVE HOTSPOTS</p>
                <p className="text-xl sm:text-2xl font-bold text-nasa-orange">2,842</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 tracking-wider">PEAK RADIATIVE POWER</p>
                <p className="text-xl sm:text-2xl font-bold text-white">418 <span className="text-xs font-normal text-slate-400">MW</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 tracking-wider">CONSTELLATION STATUS</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">NOMINAL</p>
              </div>
            </div>

            {/* Scroll Indicator (Clickable to trigger smooth cinematic advance to Section 2) */}
            <div
              onClick={scrollToSection2}
              className="flex items-center space-x-2 text-slate-400 hover:text-nasa-cyan text-xs font-mono animate-bounce cursor-pointer transition-colors"
              title="Click or scroll down to approach planet"
            >
              <span>SCROLL TO ZOOM & APPROACH PLANET</span>
              <ChevronDown className="w-4 h-4 text-nasa-cyan" />
            </div>
          </motion.div>
        </section>

        {/* Spacer for Phase 2 dramatic zoom to occur with clean viewport */}
        <div className="h-[60vh] w-full pointer-events-none" />

        {/* ================= PHASE 3: SECTION 2 MONITOR (EARTH ON RIGHT, CONTENT ON LEFT) ================= */}
        <section className="h-screen w-full flex items-center px-6 sm:px-12 lg:px-16 pointer-events-none">
          <motion.div
            style={{
              opacity: selectedSatellite ? 0 : section2Opacity,
              transform: `translateY(${section2TranslateY}px)`,
              pointerEvents: section2Opacity > 0.3 && !selectedSatellite ? 'auto' : 'none',
            }}
            className="w-full max-w-[440px] space-y-4 transition-opacity duration-300"
          >
            {/* Mission Category */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-nasa-orange/15 border border-nasa-orange/30 text-nasa-orange text-[11px] font-mono tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>CONTINUOUS THERMAL RECONNAISSANCE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              MONITOR THE PLANET.<br />
              <span className="bg-gradient-to-r from-nasa-orange via-amber-300 to-nasa-cyan bg-clip-text text-transparent">
                DETECT THE UNSEEN.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              FireSync combines satellite observations and geospatial intelligence to reveal wildfire activity across the globe.
            </p>

            {/* Interactive Floating Spacecraft Inspection Banner */}
            <div className="p-3 rounded-xl bg-space-900/80 border border-nasa-cyan/30 backdrop-blur-md font-mono space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-1.5 text-nasa-cyan font-bold text-xs">
                  <Orbit className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>SATELLITE FLEET IN SPACE</span>
                </div>
                <span className="text-[10px] text-slate-400">TAP TO INSPECT 3D</span>
              </div>
              <div className="flex items-center space-x-2 pt-0.5">
                <button
                  onClick={() => setSelectedSatellite('MODIS')}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-nasa-cyan/15 hover:bg-nasa-cyan/30 text-nasa-cyan border border-nasa-cyan/40 text-[11px] font-bold transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                >
                  <Satellite className="w-3 h-3" />
                  <span>MODIS (1KM)</span>
                </button>
                <button
                  onClick={() => setSelectedSatellite('VIIRS')}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-nasa-orange/15 hover:bg-nasa-orange/30 text-nasa-orange border border-nasa-orange/40 text-[11px] font-bold transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                >
                  <Flame className="w-3 h-3" />
                  <span>VIIRS (375M)</span>
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-space-900/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center space-x-1.5 text-nasa-cyan mb-1 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                  <span className="font-semibold text-white">HOTSPOT DETECTION</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Thermal anomaly recognition distinguishing wildfires from solar glare.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-900/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center space-x-1.5 text-nasa-cyan mb-1 text-[11px]">
                  <Satellite className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">MODIS & VIIRS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Multi-frequency radiometric passes capturing day/night perimeters at 375m.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-900/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center space-x-1.5 text-nasa-cyan mb-1 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white">FRP RADIATIVE POWER</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Instantaneous radiative power in Megawatts estimating biomass burn.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-900/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center space-x-1.5 text-nasa-cyan mb-1 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-white">HISTORICAL ARCHIVES</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Decadal wildfire trends, burn severity, and regional fire season risk.
                </p>
              </div>
            </div>

            {/* Advance to Section 3 Button & Hotspots Link */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={scrollToSection3}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-nasa-orange hover:bg-orange-600 text-white font-medium text-xs tracking-wider uppercase font-mono shadow-glow-orange transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <span>Enter Command Center</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <Link
                to="/satellites"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-space-900/80 border border-nasa-cyan/40 text-nasa-cyan hover:bg-nasa-cyan/10 font-medium text-xs tracking-wider uppercase font-mono transition-all duration-300"
              >
                <span>View Satellite Data</span>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Spacer for transition from Section 2 to Section 3 (Earth glides to center) */}
        <div className="h-[60vh] w-full pointer-events-none" />

        {/* ================= PHASE 4: SECTION 3 COMMAND CENTER RUNWAY ================= */}
        <section className="h-screen w-full flex items-center justify-center pointer-events-none" />
      </div>

      {/* ================= SATELLITE INSPECTION OVERLAY (OBJECT ON LEFT, INFO ON RIGHT) ================= */}
      <AnimatePresence>
        {selectedSatellite && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-end px-4 sm:px-10 lg:px-16 pt-16">
            {/* Clickable backdrop overlay to dismiss inspection - smooth horizontal gradient never cutting across spacecraft */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent from-25% via-space-950/20 to-space-950/75 pointer-events-auto cursor-pointer"
              onClick={() => setSelectedSatellite(null)}
            />

            {/* Right side floating NASA Satellite Info Card */}
            <div className="relative z-10 w-full max-w-xl pointer-events-auto">
              <SatelliteInfoCard
                satelliteId={selectedSatellite}
                onSelectSatellite={(id) => setSelectedSatellite(id)}
                onClose={() => setSelectedSatellite(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
