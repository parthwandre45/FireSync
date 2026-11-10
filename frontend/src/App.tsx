import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Flame, Menu, X, Orbit, ExternalLink, ShieldCheck } from 'lucide-react';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { HotspotExplorer } from './pages/HotspotExplorer/HotspotExplorer';
import { SatelliteComparison } from './pages/SatelliteComparison/SatelliteComparison';
import { HistoricalAnalysis } from './pages/HistoricalAnalysis/HistoricalAnalysis';
import { Methodology } from './pages/Methodology/Methodology';
import { AuthModal } from './components/auth/AuthModal';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'HOTSPOT MAP', path: '/hotspots' },
    { label: 'MODIS vs VIIRS', path: '/satellites' },
    { label: 'HISTORICAL', path: '/historical' },
    { label: 'METHODOLOGY', path: '/methodology' },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage && !mobileMenuOpen
          ? 'bg-transparent border-b border-transparent'
          : 'bg-space-950/80 backdrop-blur-md border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-nasa-blue to-nasa-cyan/40 p-0.5 shadow-glow-cyan/20">
            <div className="w-full h-full bg-space-950 rounded-[7px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-nasa-orange group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-nasa-cyan rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-wider text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FIRESYNC
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-nasa-blue/40 border border-nasa-cyan/30 text-nasa-cyan tracking-widest font-semibold">
                NASA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">GLOBAL WILDFIRE INTELLIGENCE</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 font-mono text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'text-white bg-white/10 border-b-2 border-nasa-cyan'
                    : 'text-slate-300 hover:text-nasa-cyan hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-nasa-blue/20 hover:bg-nasa-blue/40 border border-nasa-cyan/40 hover:border-nasa-cyan rounded-full text-xs font-mono text-nasa-cyan transition-all cursor-pointer"
            title="Operator Login & Access Control"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AUTH GATEWAY</span>
            <span className="sm:hidden">AUTH</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SAT FEEDS ONLINE</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-space-900 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-space-950/95 border-b border-white/10 px-4 py-4 space-y-2 backdrop-blur-xl font-mono text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-nasa-blue text-white font-bold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-nasa-cyan'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-nasa-cyan/20">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hotspots" element={<HotspotExplorer />} />
            <Route path="/satellites" element={<SatelliteComparison />} />
            <Route path="/historical" element={<HistoricalAnalysis />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
