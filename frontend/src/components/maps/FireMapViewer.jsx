import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import { MapPin, Satellite, Flame, Info } from 'lucide-react';

export const FireMapViewer = ({ observations }) => {
  const [activeSensor, setActiveSensor] = useState('ALL');

  const defaultCenter = [37.7749, -119.5383]; // Yosemite / Sierra Nevada
  const defaultZoom = 12;

  const modisPoints = observations?.modis || [
    { id: 'M-1', lat: 37.7749, lon: -119.5383, brightness: 335.4, frp: 45.8, satellite: 'Aqua', confidence: 85, acq_date: '2026-08-15' },
    { id: 'M-2', lat: 37.7812, lon: -119.5420, brightness: 342.1, frp: 62.3, satellite: 'Aqua', confidence: 92, acq_date: '2026-08-15' },
    { id: 'M-3', lat: 37.7650, lon: -119.5290, brightness: 328.0, frp: 38.0, satellite: 'Terra', confidence: 78, acq_date: '2026-08-15' },
  ];

  const viirsPoints = observations?.viirs || [
    { id: 'V-1', lat: 37.7748, lon: -119.5381, brightness: 355.2, frp: 49.2, satellite: 'Suomi-NPP', confidence: 'high', acq_date: '2026-08-15' },
    { id: 'V-2', lat: 37.7770, lon: -119.5395, brightness: 348.6, frp: 41.0, satellite: 'Suomi-NPP', confidence: 'nominal', acq_date: '2026-08-15' },
    { id: 'V-3', lat: 37.7805, lon: -119.5415, brightness: 362.8, frp: 68.4, satellite: 'Suomi-NPP', confidence: 'high', acq_date: '2026-08-15' },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Satellite className="w-5 h-5 text-nasa-cyan" />
            <span>NASA Active Fire Multi-Sensor Spatial Overlay</span>
          </h2>
          <p className="text-xs text-slate-400">
            Compare NASA MODIS (~1 km nominal) and VIIRS (375 m I-band) active fire detections in PostGIS coordinates.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          {['ALL', 'MODIS', 'VIIRS'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveSensor(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 border ${
                activeSensor === filter
                  ? 'bg-fire-600 border-fire-500 text-white shadow-md shadow-fire-600/30'
                  : 'bg-space-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Map viewport */}
      <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-800 relative z-10 shadow-inner">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* OpenStreetMap Standard Basemap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | NASA FIRMS'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* MODIS Observations Layer */}
          {(activeSensor === 'ALL' || activeSensor === 'MODIS') &&
            modisPoints.map((pt) => (
              <CircleMarker
                key={pt.id}
                center={[pt.lat, pt.lon]}
                radius={14}
                pathOptions={{
                  color: '#fb923c',
                  fillColor: '#f97316',
                  fillOpacity: 0.5,
                  weight: 2,
                }}
              >
                <Popup className="text-slate-900 font-sans">
                  <div className="text-xs p-1 space-y-1">
                    <div className="font-bold text-fire-700 flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>MODIS Active Fire Detection</span>
                    </div>
                    <div><strong>Sensor:</strong> MODIS ({pt.satellite})</div>
                    <div><strong>Brightness:</strong> {pt.brightness} K</div>
                    <div><strong>FRP:</strong> {pt.frp} MW</div>
                    <div><strong>Confidence:</strong> {pt.confidence}%</div>
                    <div className="text-slate-500 text-[10px]">Date: {pt.acq_date} | ~1km Grid</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* VIIRS Observations Layer */}
          {(activeSensor === 'ALL' || activeSensor === 'VIIRS') &&
            viirsPoints.map((pt) => (
              <CircleMarker
                key={pt.id}
                center={[pt.lat, pt.lon]}
                radius={8}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#dc2626',
                  fillOpacity: 0.8,
                  weight: 1.5,
                }}
              >
                <Popup className="text-slate-900 font-sans">
                  <div className="text-xs p-1 space-y-1">
                    <div className="font-bold text-red-600 flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>VIIRS Active Fire (375m)</span>
                    </div>
                    <div><strong>Satellite:</strong> {pt.satellite}</div>
                    <div><strong>Brightness:</strong> {pt.brightness} K</div>
                    <div><strong>FRP:</strong> {pt.frp} MW</div>
                    <div><strong>Confidence:</strong> {pt.confidence}</div>
                    <div className="text-slate-500 text-[10px]">Date: {pt.acq_date} | High Precision</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-fire-500 border border-fire-400 inline-block" />
            <span>MODIS (Aqua/Terra ~1km)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 inline-block" />
            <span>VIIRS (375m I-bands)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          CRS: EPSG:4326 | Standard NASA FIRMS Feed
        </div>
      </div>
    </div>
  );
};