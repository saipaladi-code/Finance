import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-600',
      border: 'border-slate-200',
    },
  };

  const style = colorStyles[colorScheme] || colorStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2.5">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-medium truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
