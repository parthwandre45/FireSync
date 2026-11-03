import React from 'react';
import { Database, Radio } from 'lucide-react';

export const DemoBadge = ({ size = 'sm', className = '' }) => {
  const sizeClasses = size === 'xs' 
    ? 'px-1.5 py-0.5 text-[10px]' 
    : 'px-2 py-0.5 text-xs';

  return (
    <span 
      className={`inline-flex items-center space-x-1 rounded-md font-mono font-medium tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
      title="This dataset utilizes NASA FIRMS specification demo data"
    >
      <Database className="w-2.5 h-2.5 text-amber-400" />
      <span>DEMO DATA</span>
    </span>
  );
};

export const LiveBadge = ({ size = 'sm', className = '', count }) => {
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span 
      className={`inline-flex items-center space-x-1.5 rounded-full font-mono font-bold tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 ${sizeClasses} ${className}`}
      title="Verified Real NASA FIRMS Satellite Active-Fire Observations from PostgreSQL"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <Radio className="w-3 h-3 text-emerald-400" />
      <span>LIVE NASA FIRMS DATA</span>
      {count !== undefined && (
        <span className="bg-emerald-950/80 text-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
          {Number(count).toLocaleString()} pts
        </span>
      )}
    </span>
  );
};