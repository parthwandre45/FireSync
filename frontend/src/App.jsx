import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { HotspotExplorerPage } from './pages/HotspotExplorerPage';
import { SensorComparisonPage } from './pages/SensorComparisonPage';
import { BurningCalendarPage } from './pages/BurningCalendarPage';
import { HistoricalAnalysisPage } from './pages/HistoricalAnalysisPage';
import { DataMethodologyPage } from './pages/DataMethodologyPage';
import { Sidebar } from './components/common/Sidebar';
import { AppHeader } from './components/common/AppHeader';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { REGIONS, DATE_PRESETS } from './data/mockFireData';
import { fetchCompositeHealth } from './services/api';

export function App() {
  // Navigation State: 'landing', 'dashboard', 'explorer', 'comparison', 'calendar', 'historical', 'methodology'
  const [currentView, setCurrentView] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Filter State across Dashboard modules
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]); // Default: Sierra Nevada
  const [selectedDateRange, setSelectedDateRange] = useState(DATE_PRESETS[1]); // Default: Last 7 Days
  const [viewMode, setViewMode] = useState('operations'); // 'operations' or 'research'

  // System Health Telemetry from backend
  const [healthData, setHealthData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchCompositeHealth();
      if (res.success) {
        setHealthData(res.data);
      }
    } catch (err) {
      console.error('Failed to load health telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLaunchApp = () => {
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectModule = (moduleId) => {
    setCurrentView(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on landing page, render LandingPage full screen
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchApp={handleLaunchApp}
        onSelectModule={handleSelectModule}
      />
    );
  }

  // Titles for Dashboard Header
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Satellite Fire Intelligence Dashboard',
          subtitle: 'Real-time multi-sensor thermal anomaly monitoring & harmonized cluster overview',
        };
      case 'explorer':
        return {
          title: 'Geospatial Hotspot Explorer',
          subtitle: 'Cartographic exploration of MODIS and VIIRS active fire detections',
        };
      case 'comparison':
        return {
          title: 'MODIS vs. VIIRS Instrument Comparison',
          subtitle: 'Sensor pixel footprint analysis, resolution disparity, and cross-calibration models',
        };
      case 'calendar':
        return {
          title: 'Harmonized Burning Activity Calendar',
          subtitle: 'Daily & monthly continuous fire radiative power curves across sensor transitions',
        };
      case 'historical':
        return {
          title: 'Multi-Year Wildfire Historical Analysis',
          subtitle: '2020–2026 fire regime trajectory, climatological baselines, and anomaly detection',
        };
      case 'methodology':
        return {
          title: 'Data Architecture & Scientific Methodology',
          subtitle: 'FIRMS ingest specifications, DBSCAN clustering formulas, and dataset exporter',
        };
      default:
        return {
          title: 'FireSync Platform',
          subtitle: 'NASA Space Apps Challenge 2026',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex font-sans selection:bg-fire-600 selection:text-white">
      
      {/* 1. Collapsible Sidebar Navigation */}
      <Sidebar
        activeTab={currentView}
        setActiveTab={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onGoToLanding={() => setCurrentView('landing')}
      />

      {/* 2. Main Application Area (padded left on lg screens for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Top Header with Region & Date filters + Operations/Research toggle */}
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          viewMode={viewMode}
          setViewMode={setViewMode}
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
        />

        {/* Responsive Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <ErrorBoundary
            key={currentView}
            onNavigateDashboard={() => setCurrentView('dashboard')}
          >
            {currentView === 'dashboard' && (
              <DashboardPage
                selectedRegion={selectedRegion}
                selectedDateRange={selectedDateRange}
                viewMode={viewMode}
                onNavigate={setCurrentView}
                healthData={healthData}
                isRefreshing={isRefreshing}
              />
            )}

            {currentView === 'explorer' && (
              <HotspotExplorerPage
                selectedRegion={selectedRegion}
              />
            )}

            {currentView === 'comparison' && (
              <SensorComparisonPage />
            )}

            {currentView === 'calendar' && (
              <BurningCalendarPage
                selectedRegion={selectedRegion}
              />
            )}

            {currentView === 'historical' && (
              <HistoricalAnalysisPage
                selectedRegion={selectedRegion}
                viewMode={viewMode}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'methodology' && (
              <DataMethodologyPage
                selectedRegion={selectedRegion}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-space-950/80 py-4 px-6 mt-12 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              FireSync © 2026 – Built for <strong>NASA Space Apps Challenge 2026</strong>.
            </div>
            <div className="font-mono text-slate-400 flex items-center space-x-3">
              <span>Sensor Continuity Engine</span>
              <span>•</span>
              <button 
                onClick={() => setCurrentView('methodology')}
                className="hover:text-nasa-cyan transition-colors"
              >
                Methodology & Export
              </button>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}

export default App;