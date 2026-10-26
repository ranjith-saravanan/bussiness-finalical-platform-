import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ForecastData } from '../types';
import { Card, StatCard, LoadingSpinner } from '../components/UI';
import { Sparkles, TrendingUp, TrendingDown, Minus, Info, ArrowRight, ShieldAlert, Calendar } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getForecast();
      setForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!forecast) return <div>Failed to compute projection</div>;

  const isPositive = forecast.forecasted_net_cashflow >= 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles size={13} />
          <span>Historical → Current → Forecast Progression</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial & Cash-Flow Forecasting</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Forward-looking projection combining linear regression slope with moving average and fixed commitments.
        </p>
      </div>

      {/* Progression Pipeline: Historical -> Current -> Forecast */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Calendar size={14} className="text-indigo-600" />
          Trajectory Timeline (Historical → Current → Forecast)
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full p-4 bg-white rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Historical Base</span>
            <p className="font-bold text-slate-800 text-sm">
              {forecast.historical_months.length > 0 ? `${forecast.historical_months.length} Month(s) Recorded` : 'Current Baseline'}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Verified past ledger entries
            </p>
          </div>

          <ArrowRight size={18} className="text-slate-300 shrink-0 hidden md:block" />

          <div className="flex-1 w-full p-4 bg-white rounded-xl border border-indigo-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">2. Monthly Recurring Commitments</span>
            <p className="font-bold text-slate-900 text-sm">
              ${forecast.recurring_commitments?.toLocaleString() ?? 0} / mo
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Fixed recurring bills & overhead
            </p>
          </div>

          <ArrowRight size={18} className="text-slate-300 shrink-0 hidden md:block" />

          <div className="flex-1 w-full p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl border border-indigo-800 text-xs shadow-md">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">3. Projected {forecast.forecast_month}</span>
            <p className="font-bold text-emerald-300 text-sm">
              ${forecast.forecasted_net_cashflow.toLocaleString()} Net Cash Flow
            </p>
            <p className="text-indigo-200 text-[11px] mt-0.5">
              Range: ${forecast.forecast_lower?.toLocaleString() ?? forecast.forecasted_net_cashflow} to ${forecast.forecast_upper?.toLocaleString() ?? forecast.forecasted_net_cashflow}
            </p>
          </div>
        </div>
      </div>

      {/* Projection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title={`Projected Income (${forecast.forecast_month})`}
          value={`$${forecast.forecasted_income.toLocaleString()}`}
          subtitle={`Trend: ${forecast.income_trend ?? 'Stable'}`}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          title={`Projected Expenses (${forecast.forecast_month})`}
          value={`$${forecast.forecasted_expenses.toLocaleString()}`}
          subtitle={`Trend: ${forecast.expense_trend ?? 'Stable'}`}
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <StatCard
          title="Projected Net Cash Flow"
          value={`$${forecast.forecasted_net_cashflow.toLocaleString()}`}
          subtitle={isPositive ? 'Expected cash surplus' : 'Potential cash deficit'}
          icon={isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          color={isPositive ? 'green' : 'red'}
        />
        <StatCard
          title="Trajectory Direction"
          value={forecast.trend_direction.toUpperCase()}
          subtitle="Directional confidence"
          icon={forecast.trend_direction === 'positive' ? <TrendingUp size={20} /> : forecast.trend_direction === 'negative' ? <TrendingDown size={20} /> : <Minus size={20} />}
          color={forecast.trend_direction === 'positive' ? 'green' : 'amber'}
        />
      </div>

      {/* Confidence Range & Disclaimers */}
      <Card
        title="Forecast Range & Operating Assumptions"
        subtitle="Statistical modeling band to avoid false precision"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Conservative Baseline (Lower Bound):</span>
              <strong className="text-slate-800">${forecast.forecast_lower?.toLocaleString() ?? (forecast.forecasted_net_cashflow * 0.85).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Expected Mean Projection:</span>
              <strong className="text-indigo-600 font-bold">${forecast.forecasted_net_cashflow.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Optimistic Upside (Upper Bound):</span>
              <strong className="text-emerald-700">${forecast.forecast_upper?.toLocaleString() ?? (forecast.forecasted_net_cashflow * 1.15).toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 text-amber-900 rounded-xl border border-amber-200/80 text-xs">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Model Disclaimer:</strong> {forecast.disclaimer} Always verify client payment terms and maintain your safe spending buffer before committing capital.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
