import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'default', 'success', 'danger', 'info'
}) {
  const variantStyles = {
    default: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
    },
    success: {
      bg: 'bg-white',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-600',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-rose-600',
    },
    info: {
      bg: 'bg-white',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
      valueColor: 'text-indigo-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className={`text-2xl font-bold font-tabular tracking-tight ${style.valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
