import React, { useState } from 'react';
import { 
  FileCode2, 
  Database, 
  Download, 
  Check, 
  Copy, 
  BookOpen, 
  Cpu, 
  Layers, 
  ExternalLink,
  Code2,
  FileCheck2
} from 'lucide-react';
import { DemoBadge, LiveBadge } from '../components/common/DemoBadge';
import { DEMO_HOTSPOTS } from '../data/mockFireData';
import { getHistoricalExportUrl } from '../services/api';

export const DataMethodologyPage = ({ selectedRegion }) => {
  const [selectedDataset, setSelectedDataset] = useState('harmonized'); // harmonized, modis, viirs
  const [exportFormat, setExportFormat] = useState('geojson'); // geojson, csv
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSchemaSnippet = `-- PostgreSQL + PostGIS Schema for FireSync Harmonized Clusters
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE harmonized_fire_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id VARCHAR(64) NOT NULL,
    region_name VARCHAR(128) NOT NULL,
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    peak_burning_date DATE NOT NULL,
    total_frp_mw NUMERIC(12, 2) NOT NULL,
    estimated_burned_area_ha NUMERIC(12, 2) NOT NULL,
    modis_detection_count INT DEFAULT 0,
    viirs_detection_count INT DEFAULT 0,
    sensor_consistency_index NUMERIC(4, 3) CHECK (sensor_consistency_index BETWEEN 0 AND 1),
    cluster_centroid GEOMETRY(Point, 4326) NOT NULL,
    cluster_boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_harmonized_centroid ON harmonized_fire_calendar USING GIST (cluster_centroid);
CREATE INDEX idx_harmonized_dates ON harmonized_fire_calendar (event_start_date, event_end_date);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Real, functioning dataset download
  const handleExportData = () => {
    if (exportFormat === 'csv' && selectedRegion.isLive) {
      const exportType = selectedDataset === 'harmonized' ? 'daily_summary' : 'observations';
      const sensor = selectedDataset === 'modis' ? 'MODIS' : selectedDataset === 'viirs' ? 'VIIRS' : undefined;
      const downloadUrl = getHistoricalExportUrl({
        type: exportType,
        sensor,
        country: 'IND',
        startDate: '2026-10-26',
        endDate: '2026-11-03',
        limit: 10000,
      });
      window.open(downloadUrl, '_blank');
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      const regionData = DEMO_HOTSPOTS[selectedRegion.id] || DEMO_HOTSPOTS.sierra_nevada;
      let payloadContent = '';
      let filename = `FireSync_${selectedRegion.id}_${selectedDataset}.${exportFormat}`;
      let mimeType = 'text/plain';

      if (exportFormat === 'geojson') {
        let features = [];

        if (selectedDataset === 'harmonized') {
          features = regionData.harmonized.map((c) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [c.centroid[1], c.centroid[0]],
            },
            properties: {
              cluster_id: c.cluster_id,
              name: c.name,
              total_frp_mw: c.total_frp,
              estimated_burned_area_ha: c.estimated_burned_area_ha,
              consistency_index: c.consistency_index,
              status: c.status,
            },
          }));
        } else if (selectedDataset === 'modis') {
          features = regionData.modis.map((p) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.lon, p.lat],
            },
            properties: {
              id: p.id,
              sensor: 'MODIS',
              satellite: p.satellite,
              frp_mw: p.frp,
              brightness_k: p.brightness,
              confidence_pct: p.confidence,
              acq_date: p.acq_date,
              acq_time: p.acq_time,
            },
          }));
        } else {
          features = regionData.viirs.map((p) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.lon, p.lat],
            },
            properties: {
              id: p.id,
              sensor: 'VIIRS',
              satellite: p.satellite,
              frp_mw: p.frp,
              brightness_k: p.brightness,
              confidence: p.confidence,
              acq_date: p.acq_date,
              acq_time: p.acq_time,
            },
          }));
        }

        payloadContent = JSON.stringify({
          type: 'FeatureCollection',
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
          metadata: {
            project: 'FireSync NASA Space Apps Challenge 2026',
            region: selectedRegion.name,
            dataset: selectedDataset,
            disclaimer: 'DEMO DATA for demonstration based on NASA FIRMS schema',
          },
          features,
        }, null, 2);
        mimeType = 'application/geo+json';
      } else {
        // CSV export
        if (selectedDataset === 'harmonized') {
          const headers = ['cluster_id', 'name', 'latitude', 'longitude', 'total_frp_mw', 'burned_area_ha', 'consistency_index', 'status'];
          const rows = regionData.harmonized.map((c) => [c.cluster_id, `"${c.name}"`, c.centroid[0], c.centroid[1], c.total_frp, c.estimated_burned_area_ha, c.consistency_index, c.status].join(','));
          payloadContent = [headers.join(','), ...rows].join('\n');
        } else {
          const dataList = selectedDataset === 'modis' ? regionData.modis : regionData.viirs;
          const headers = ['id', 'sensor', 'satellite', 'latitude', 'longitude', 'frp_mw', 'brightness_k', 'confidence', 'acq_date', 'acq_time'];
          const rows = dataList.map((p) => [p.id, p.instrument, p.satellite, p.lat, p.lon, p.frp, p.brightness, p.confidence, p.acq_date, p.acq_time].join(','));
          payloadContent = [headers.join(','), ...rows].join('\n');
        }
        mimeType = 'text/csv';
      }

      const blob = new Blob([payloadContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-nasa-cyan" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Data Pipeline & Harmonization Methodology
            </h2>
            {selectedRegion?.isLive ? (
              <LiveBadge size="xs" count="24,395" />
            ) : (
              <DemoBadge size="xs" />
            )}
          </div>
          <span className="text-xs font-mono text-slate-400">
            Open Science Architecture Specifications
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          FireSync implements an open-source mathematical harmonization pipeline built on GeoPandas, Shapely, 
          and PostgreSQL PostGIS. Below are the core equations, algorithms, database schemas, and interactive export utilities.
        </p>
      </div>

      {/* 2. Interactive Data Exporter Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 bg-space-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Download className="w-4 h-4 text-fire-500" />
              <span>Interactive Satellite Fire Dataset Exporter</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Download standard GIS-ready GeoJSON or tabular CSV files for your GIS or Python research workflow.
            </p>
          </div>
          {selectedRegion.isLive ? (
            <LiveBadge size="xs" count="24,395" />
          ) : (
            <DemoBadge size="xs" />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-space-950 border border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block font-mono text-[10px] mb-1">Select Dataset:</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-space-900 border border-slate-800 text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="harmonized">Harmonized Clusters (Unified)</option>
              <option value="modis">NASA MODIS Active Fires (1km)</option>
              <option value="viirs">NASA VIIRS Active Fires (375m)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block font-mono text-[10px] mb-1">Target Geographic Region:</label>
            <div className="py-1.5 px-2.5 rounded-lg bg-space-900 border border-slate-800 text-slate-200 font-mono text-[11px] truncate">
              {selectedRegion.name}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block font-mono text-[10px] mb-1">File Format:</label>
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-space-900 border border-slate-800 text-slate-200 font-mono focus:outline-none cursor-pointer"
              >
                <option value="geojson">GeoJSON (.geojson)</option>
                <option value="csv">Tabular CSV (.csv)</option>
              </select>

              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-1.5 rounded-lg bg-fire-600 hover:bg-fire-500 text-white font-semibold transition-all shadow-md shadow-fire-600/20 active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isExporting ? 'Exporting...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Harmonization Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Method 1: Spatio-temporal Clustering */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-nasa-cyan font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>1. Spatio-Temporal DBSCAN</span>
          </div>
          <h3 className="font-bold text-white text-sm">Adaptive Clustering Algorithm</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Detections from MODIS and VIIRS within a spatial radius of <strong>R = 1.5 km</strong> and a temporal window of <strong>Δt = 48 hours</strong> are grouped into common fire event complexes using the Haversine distance metric.
          </p>
          <div className="p-3 rounded-xl bg-space-950 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500 text-[10px]">Distance Metric:</div>
            <div>D_st = √( (D_geo / 1.5km)² + (Δt / 48h)² )</div>
            <div className="text-emerald-400 text-[10px] pt-1">Condition: D_st ≤ 1.0</div>
          </div>
        </div>

        {/* Method 2: Cross-Calibration Index */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-fire-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>2. Cross-Calibration Index</span>
          </div>
          <h3 className="font-bold text-white text-sm">Sensor Consistency Formula</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Measures spatial co-occurrence between MODIS 1km observations and VIIRS 375m observations to calculate a confidence index (0.0 to 1.0) indicating cluster integrity.
          </p>
          <div className="p-3 rounded-xl bg-space-950 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500 text-[10px]">Consistency Index Formula:</div>
            <div>C_sensor = 2 × |M ∩ V| / (|M| + |V|)</div>
            <div className="text-nasa-gold text-[10px] pt-1">Range: 0.0 (Unconfirmed) to 1.0 (Full Alignment)</div>
          </div>
        </div>

        {/* Method 3: Burned Area Conversion */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <FileCheck2 className="w-4 h-4" />
            <span>3. Wooster FRE Model</span>
          </div>
          <h3 className="font-bold text-white text-sm">Biomass to Burned Area</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Instantaneous FRP (MW) is numerically integrated over time into Fire Radiative Energy (MJ), which converts to Dry Biomass Combusted and land-cover area (Wooster et al., 2005).
          </p>
          <div className="p-3 rounded-xl bg-space-950 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500 text-[10px]">FRE Formulation:</div>
            <div>FRE = ∫ FRP(t) dt ≈ ∑ FRP_avg × Δt</div>
            <div className="text-emerald-400 text-[10px] pt-1">Area (Ha) = (Biomass Combusted / Fuel Load)</div>
          </div>
        </div>

      </div>

      {/* 4. PostgreSQL + PostGIS Schema Snippet with Copy Feature */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-nasa-cyan" />
            <h3 className="text-sm font-bold text-white">PostgreSQL + PostGIS Schema Definition</h3>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy SQL Snippet</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-space-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
          <pre>{sqlSchemaSnippet}</pre>
        </div>
      </div>

    </div>
  );
};