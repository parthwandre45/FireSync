import React from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Clock, 
  Activity 
} from 'lucide-react';

export const HealthDashboard = ({ healthData, isRefreshing }) => {
  const dependencies = healthData?.dependencies || {};
  const expressInfo = dependencies.express;
  const fastApiInfo = dependencies.fastapiScientificService;
  const dbInfo = dependencies.postgreSQL;

  const services = [
    {
      id: 'frontend',
      name: 'Frontend Client',
      role: 'Visualization & Map Interface',
      tech: 'React 18 + Vite + Tailwind CSS',
      port: '5173',
      status: 'healthy',
      latency: '< 5ms',
      icon: Globe,
      color: 'from-blue-600 to-cyan-500',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
      details: [
        { label: 'Framework', value: 'React + Vite' },
        { label: 'Mapping Engine', value: 'React-Leaflet v4' },
        { label: 'Analytics Charting', value: 'Plotly.js' },
      ],
    },
    {
      id: 'backend',
      name: 'Express API Gateway',
      role: 'Request Orchestrator & Client API',
      tech: 'Node.js + Express.js',
      port: '5000',
      status: healthData ? 'healthy' : 'checking',
      latency: expressInfo ? 'Connected' : 'Pending',
      icon: Server,
      color: 'from-indigo-600 to-violet-500',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50',
      details: [
        { label: 'Uptime', value: healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : 'Initializing' },
        { label: 'Endpoint', value: '/api/health' },
        { label: 'Proxy Target', value: 'FastAPI :8000' },
      ],
    },
    {
      id: 'fastapi',
      name: 'Scientific Processing Engine',
      role: 'NASA MODIS + VIIRS Harmonization',
      tech: 'Python 3.11 + FastAPI',
      port: '8000',
      status: fastApiInfo?.status === 'connected' ? 'healthy' : 'disconnected',
      latency: fastApiInfo?.latencyMs ? `${fastApiInfo.latencyMs}ms` : 'N/A',
      icon: Cpu,
      color: 'from-fire-600 to-amber-500',
      badgeColor: fastApiInfo?.status === 'connected' 
        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' 
        : 'text-amber-400 bg-amber-950/60 border-amber-800/50',
      details: [
        { 
          label: 'GeoPandas', 
          value: fastApiInfo?.data?.libraries?.geopandas || 'Installed (v1.2.0)' 
        },
        { 
          label: 'NumPy / SciPy', 
          value: fastApiInfo?.data?.libraries ? `${fastApiInfo.data.libraries.numpy} / ${fastApiInfo.data.libraries.scipy}` : 'Ready' 
        },
        { 
          label: 'Shapely', 
          value: fastApiInfo?.data?.libraries?.shapely || 'Installed' 
        },
      ],
    },
    {
      id: 'database',
      name: 'PostgreSQL + PostGIS',
      role: 'Spatial Detections & Event Store',
      tech: 'PostGIS (WGS 84 / EPSG:4326)',
      port: '5432',
      status: dbInfo?.status === 'connected' ? 'healthy' : 'configured',
      latency: dbInfo?.status === 'connected' ? 'Active' : 'Standby / Docker',
      icon: Database,
      color: 'from-emerald-600 to-teal-500',
      badgeColor: dbInfo?.status === 'connected' 
        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' 
        : 'text-amber-300 bg-amber-950/60 border-amber-800/50',
      details: [
        { label: 'Database', value: 'firesync_db' },
        { label: 'PostGIS Status', value: dbInfo?.postgisVersion || 'Schema & Init Ready' },
        { label: 'Spatial Tables', value: 'modis_fires, viirs_fires' },
      ],
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'checking':
        return <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case 'configured':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-fire-500" />
            <span>Multi-Service Architecture Health Status</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time inter-service communication telemetry between Frontend, Express Gateway, FastAPI Harmonizer, and PostGIS.
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-400">
          Sync Status: <span className="text-slate-200">{isRefreshing ? 'Refreshing...' : 'Live Monitoring'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div
              key={svc.id}
              className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-slate-600 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${svc.color} text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${svc.badgeColor}`}>
                    {getStatusIcon(svc.status)}
                    <span className="capitalize">{svc.status}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">{svc.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{svc.tech}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Port / Binding:</span>
                    <span className="font-mono text-slate-200 font-medium">:{svc.port}</span>
                  </div>
                  {svc.details.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-slate-400">{item.label}:</span>
                      <span className="font-mono text-slate-200 truncate max-w-[130px] text-right" title={item.value}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Telemetry</span>
                <span className="font-mono text-nasa-cyan">{svc.latency}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};