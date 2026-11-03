import React from 'react';
import Plot from 'react-plotly.js';
import { Calendar, BarChart3 } from 'lucide-react';

export const BurningCalendarChart = ({ calendarData }) => {
  const defaultData = [
    { date: '2026-08-12', modisFrp: 12.4, viirsFrp: 18.2, totalFrp: 30.6, burnedAreaHa: 480 },
    { date: '2026-08-13', modisFrp: 35.8, viirsFrp: 48.0, totalFrp: 83.8, burnedAreaHa: 1320 },
    { date: '2026-08-14', modisFrp: 88.5, viirsFrp: 112.4, totalFrp: 200.9, burnedAreaHa: 3170 },
    { date: '2026-08-15', modisFrp: 146.1, viirsFrp: 158.6, totalFrp: 304.7, burnedAreaHa: 4810 },
    { date: '2026-08-16', modisFrp: 95.2, viirsFrp: 104.1, totalFrp: 199.3, burnedAreaHa: 3140 },
    { date: '2026-08-17', modisFrp: 42.0, viirsFrp: 51.3, totalFrp: 93.3, burnedAreaHa: 1470 },
    { date: '2026-08-18', modisFrp: 15.1, viirsFrp: 19.8, totalFrp: 34.9, burnedAreaHa: 550 },
  ];

  const dataset = calendarData || defaultData;
  const dates = dataset.map((d) => d.date);
  const modisFrp = dataset.map((d) => d.modisFrp);
  const viirsFrp = dataset.map((d) => d.viirsFrp);
  const totalHarmonized = dataset.map((d) => d.totalFrp);

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-fire-500" />
            <span>Harmonized Historical Burning Activity Calendar</span>
          </h2>
          <p className="text-xs text-slate-400">
            Temporal synthesis of Fire Radiative Power (MW) harmonized across MODIS & VIIRS satellite overpasses.
          </p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-space-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <BarChart3 className="w-3.5 h-3.5 text-nasa-gold" />
          <span>Multi-Sensor FRP Synthesis</span>
        </div>
      </div>

      <div className="w-full h-80 rounded-xl overflow-hidden bg-space-900/60 border border-slate-800 p-2">
        <Plot
          data={[
            {
              x: dates,
              y: modisFrp,
              name: 'MODIS FRP (MW)',
              type: 'bar',
              marker: { color: 'rgba(251, 146, 60, 0.7)' },
            },
            {
              x: dates,
              y: viirsFrp,
              name: 'VIIRS FRP (MW)',
              type: 'bar',
              marker: { color: 'rgba(239, 68, 68, 0.75)' },
            },
            {
              x: dates,
              y: totalHarmonized,
              name: 'Harmonized Activity Curve',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: '#00e5ff', width: 3, shape: 'spline' },
              marker: { size: 6, color: '#fdb813' },
            },
          ]}
          layout={{
            autosize: true,
            barmode: 'group',
            margin: { l: 45, r: 25, t: 30, b: 40 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            showlegend: true,
            legend: {
              orientation: 'h',
              y: 1.15,
              x: 0,
              font: { color: '#94a3b8', size: 11 },
            },
            xaxis: {
              color: '#94a3b8',
              gridcolor: 'rgba(255, 255, 255, 0.05)',
              tickfont: { size: 10 },
            },
            yaxis: {
              title: { text: 'Fire Radiative Power (MW)', font: { size: 10, color: '#94a3b8' } },
              color: '#94a3b8',
              gridcolor: 'rgba(255, 255, 255, 0.05)',
              tickfont: { size: 10 },
            },
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>
    </div>
  );
};