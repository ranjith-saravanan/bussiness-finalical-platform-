import React from 'react';
import { X } from 'lucide-react';

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scaleUp">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'brand' | 'green' | 'red' | 'blue' | 'amber';
}> = ({ title, value, subtitle, icon, trend, color = 'brand' }) => {
  const colorMap = {
    brand: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    blue: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-semibold mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
          </p>
        )}
      </div>
      {icon && <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>}
    </div>
  );
};

export const ProgressBar: React.FC<{
  value: number; // 0 to 100
  max?: number;
  color?: string;
  showLabel?: boolean;
}> = ({ value, max = 100, color = 'bg-indigo-600', showLabel = true }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 mt-1 font-medium">
          <span>{pct.toFixed(0)}% used</span>
          <span>{max - value > 0 ? `$${(max - value).toFixed(0)} left` : 'Exceeded'}</span>
        </div>
      )}
    </div>
  );
};

export const SimpleBarChart: React.FC<{
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
}> = ({ data, height = 180 }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-xs text-slate-400">No chart data available</div>;
  }
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.secondary || 0)), 1);

  return (
    <div className="w-full pt-4">
      <div className="flex items-end justify-between gap-3" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const h1 = (item.value / maxVal) * 100;
          const h2 = item.secondary ? (item.secondary / maxVal) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1.5 h-full">
                <div
                  className="w-1/2 max-w-[28px] bg-indigo-500 rounded-t-md transition-all group-hover:bg-indigo-600 relative"
                  style={{ height: `${Math.max(4, h1)}%` }}
                  title={`${item.label}: $${item.value.toLocaleString()}`}
                />
                {item.secondary !== undefined && (
                  <div
                    className="w-1/2 max-w-[28px] bg-rose-400 rounded-t-md transition-all group-hover:bg-rose-500 relative"
                    style={{ height: `${Math.max(4, h2)}%` }}
                    title={`${item.label} (Expense): $${item.secondary.toLocaleString()}`}
                  />
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SimpleLineChart: React.FC<{
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}> = ({ data, height = 160, color = '#6366f1' }) => {
  if (!data || data.length < 2) {
    return <div className="text-center py-8 text-xs text-slate-400">Need at least 2 data points for line trend</div>;
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, minVal + 1);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 300;
    const y = height - ((d.value - minVal) / range) * (height - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 300 ${height}`} className="w-full h-auto overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 300;
          const y = height - ((d.value - minVal) / range) * (height - 30) - 15;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#ffffff"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-slate-400 mt-2">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

export const Badge: React.FC<{
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}> = ({ variant = 'info', children }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
    <h4 className="text-base font-semibold text-slate-700">{title}</h4>
    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
    {action && <div>{action}</div>}
  </div>
);
