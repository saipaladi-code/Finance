import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'navy';
  indicator?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  indicator,
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'bg-blue-100 text-blue-800',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'bg-amber-100 text-amber-800',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'bg-rose-100 text-rose-800',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'bg-indigo-100 text-indigo-800',
    },
    slate: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      badge: 'bg-slate-100 text-slate-800',
    },
    navy: {
      bg: 'bg-[#142B4A]/10 text-[#142B4A] border-[#142B4A]/20',
      badge: 'bg-[#142B4A]/15 text-[#142B4A]',
    },
  };

  const style = colorStyles[colorScheme] || colorStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase line-clamp-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${style.bg} shadow-xs group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
        )}
        {indicator && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge} ml-auto shrink-0`}>
            {indicator}
          </span>
        )}
      </div>
    </div>
  );
};
