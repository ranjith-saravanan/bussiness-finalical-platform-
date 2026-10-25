import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ForecastData } from '../types';
import { Card, StatCard, SimpleBarChart, LoadingSpinner } from '../components/UI';
import { LineChart, Sparkles, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

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

  const comparisonChartData = [
    ...forecast.historical_months.map(m => ({
      label: m,
      value: 0, // Placeholder if historical detail not expanded
    })),
    {
      label: `${forecast.forecast_month} (Est.)`,
      value: forecast.forecasted_income,
      secondary: forecast.forecasted_expenses
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles size={13} />
          <span>Statistical Linear Model + Moving Average</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial & Cash-Flow Forecasting</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Lightweight statistical regression projecting next month's financial trajectory based on past trends.
        </p>
      </div>

      {/* Projection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title={`Projected Income (${forecast.forecast_month})`}
          value={`$${forecast.forecasted_income.toLocaleString()}`}
          subtitle="Estimated inbound funds"
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          title={`Projected Expenses (${forecast.forecast_month})`}
          value={`$${forecast.forecasted_expenses.toLocaleString()}`}
          subtitle="Estimated operational outflow"
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <StatCard
          title="Projected Net Cash Flow"
          value={`$${forecast.forecasted_net_cashflow.toLocaleString()}`}
          subtitle={isPositive ? 'Projected cash surplus' : 'Projected liquidity deficit'}
          icon={isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          color={isPositive ? 'green' : 'red'}
        />
        <StatCard
          title="Estimated Trend Direction"
          value={forecast.trend_direction.toUpperCase()}
          subtitle="Directional indicator"
          icon={forecast.trend_direction === 'positive' ? <TrendingUp size={20} /> : forecast.trend_direction === 'negative' ? <TrendingDown size={20} /> : <Minus size={20} />}
          color={forecast.trend_direction === 'positive' ? 'green' : 'amber'}
        />
      </div>

      {/* Forecast Visual Card */}
      <Card
        title={`Projected Cash Flow: ${forecast.forecast_month}`}
        subtitle="Estimated Inflow vs Outflow based on historical slope"
      >
        <div className="flex items-center gap-4 text-xs font-semibold mb-4">
          <span className="flex items-center gap-1.5 text-indigo-600">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Projected Income: ${forecast.forecasted_income.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Projected Expenses: ${forecast.forecasted_expenses.toLocaleString()}
          </span>
        </div>
        <SimpleBarChart
          data={[
            {
              label: `${forecast.forecast_month} Forecast`,
              value: forecast.forecasted_income,
              secondary: forecast.forecasted_expenses
            }
          ]}
          height={200}
        />
      </Card>

      {/* Methodology & Disclaimer Notice */}
      <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">Statistical Methodology & Disclaimer</p>
          <p>{forecast.disclaimer}</p>
          <p className="mt-1 text-amber-800">
            Calculated using least-squares linear regression blended with a 3-month moving average dampener.
            Projections improve in accuracy as you log more consecutive months of transactions.
          </p>
        </div>
      </div>
    </div>
  );
};
