
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, colorClass }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
