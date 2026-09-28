import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f97316', // orange
  '#14b8a6', // teal
  '#64748b', // slate
];

export default function CategoryPieChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        No expense data for this period
      </div>
    );
  }

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-semibold text-slate-800">{item.categoryName}</p>
          <p className="text-slate-600 font-medium">Amount: {formatCurrency(item.amount)}</p>
          <p className="text-emerald-600 font-semibold">{item.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
      <div className="h-60 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto pr-2 space-y-2">
        {data.map((item, index) => (
          <div key={item.categoryId || index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium text-slate-700 truncate">{item.categoryName}</span>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
              <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
              <span className="text-[10px] text-slate-400 block">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
