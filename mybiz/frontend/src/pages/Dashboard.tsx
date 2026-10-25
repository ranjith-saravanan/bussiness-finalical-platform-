import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api';
import { DashboardSummary } from '../types';
import { StatCard, Card, ProgressBar, SimpleBarChart, LoadingSpinner } from '../components/UI';
import {
  Wallet,
  ArrowDownCircle,
  TrendingUp,
  PiggyBank,
  PieChart,
  DollarSign,
  Building,
  Sparkles,
  PlusCircle,
  Briefcase
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-rose-600 font-semibold mb-2">Error loading dashboard</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Bar chart data for Personal vs Business comparison
  const comparisonData = [
    { label: 'Personal', value: data.total_personal_income, secondary: data.total_personal_expense },
    { label: 'Business', value: data.business_revenue, secondary: data.business_expenses },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
            <Sparkles size={13} />
            <span>AI Executive Snapshot</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Financial Dashboard</h2>
          <p className="text-sm text-slate-300 mt-1">
            Real-time consolidation of your personal liquidity and business operating performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/income"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5"
          >
            <PlusCircle size={15} /> + Income
          </NavLink>
          <NavLink
            to="/expenses"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5"
          >
            <PlusCircle size={15} /> + Expense
          </NavLink>
          <NavLink
            to="/sales"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <PlusCircle size={15} /> + Record Sale
          </NavLink>
        </div>
      </div>

      {/* Primary KPI Grid (Personal & Business) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personal Net Cash Flow */}
        <StatCard
          title="Net Personal Cash Flow"
          value={`$${data.net_personal_cashflow.toLocaleString()}`}
          subtitle={data.net_personal_cashflow >= 0 ? 'Positive cash generation' : 'Expenses exceed income'}
          icon={<TrendingUp size={22} />}
          color={data.net_personal_cashflow >= 0 ? 'green' : 'red'}
        />

        {/* Total Personal Income */}
        <StatCard
          title="Total Personal Income"
          value={`$${data.total_personal_income.toLocaleString()}`}
          subtitle="Cumulative verified earnings"
          icon={<Wallet size={22} />}
          color="brand"
        />

        {/* Total Personal Expenses */}
        <StatCard
          title="Total Personal Expenses"
          value={`$${data.total_personal_expense.toLocaleString()}`}
          subtitle="Recorded personal spending"
          icon={<ArrowDownCircle size={22} />}
          color="red"
        />

        {/* Net Combined Cash Flow */}
        <StatCard
          title="Total Cross-Realm Net"
          value={`$${data.net_total_cashflow.toLocaleString()}`}
          subtitle="Personal Net + Business Profit"
          icon={<DollarSign size={22} />}
          color={data.net_total_cashflow >= 0 ? 'green' : 'amber'}
        />
      </div>

      {/* Secondary Metrics: Business Performance & Budgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Business Revenue */}
        <StatCard
          title="Business Revenue"
          value={`$${data.business_revenue.toLocaleString()}`}
          subtitle="Paid sales & inbound revenue"
          icon={<Building size={22} />}
          color="blue"
        />

        {/* Business Expenses */}
        <StatCard
          title="Business Expenses"
          value={`$${data.business_expenses.toLocaleString()}`}
          subtitle="Operational OpEx / CapEx"
          icon={<Briefcase size={22} />}
          color="amber"
        />

        {/* Business Net Profit */}
        <StatCard
          title="Business Net Profit"
          value={`$${data.business_profit.toLocaleString()}`}
          subtitle={data.business_profit >= 0 ? 'Profitable venture operations' : 'Operating at a deficit'}
          icon={<TrendingUp size={22} />}
          color={data.business_profit >= 0 ? 'green' : 'red'}
        />

        {/* Savings Current */}
        <StatCard
          title="Active Savings"
          value={`$${data.total_savings_current.toLocaleString()}`}
          subtitle={`Target: $${data.total_savings_target.toLocaleString()}`}
          icon={<PiggyBank size={22} />}
          color="brand"
        />
      </div>

      {/* Main Charts & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Bar Chart */}
        <Card
          title="Income vs Expenses"
          subtitle="Personal earnings vs business operating numbers"
          className="lg:col-span-2"
        >
          <div className="flex items-center gap-4 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Income / Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Expenses
            </span>
          </div>
          <SimpleBarChart data={comparisonData} height={200} />
        </Card>

        {/* Budget Utilization Widget */}
        <Card
          title="Current Month Budget"
          subtitle="Spent vs allocated limits"
          action={
            <NavLink to="/budgets" className="text-xs text-indigo-600 font-semibold hover:underline">
              View All
            </NavLink>
          }
        >
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-slate-500 font-medium">Monthly Allocation</span>
                <span className="text-sm font-bold text-slate-800">
                  ${data.total_budget_spent.toLocaleString()} / ${data.total_budget_allocated.toLocaleString()}
                </span>
              </div>
              <ProgressBar
                value={data.total_budget_spent}
                max={data.total_budget_allocated || 1}
                color={data.total_budget_spent > data.total_budget_allocated ? 'bg-rose-500' : 'bg-indigo-600'}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {data.total_budget_allocated === 0 ? (
                  <span>No budget set for this month. Set category budgets to receive automated spend alerts.</span>
                ) : data.total_budget_spent > data.total_budget_allocated ? (
                  <span className="text-rose-600 font-semibold">
                    Warning: Monthly budget limit exceeded by ${(data.total_budget_spent - data.total_budget_allocated).toFixed(2)}.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    Good discipline: ${(data.total_budget_allocated - data.total_budget_spent).toFixed(2)} remaining in your monthly budget.
                  </span>
                )}
              </p>
            </div>

            <NavLink
              to="/ai-advisor"
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Sparkles size={14} />
              <span>Ask AI for Budget Advice</span>
            </NavLink>
          </div>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card
        title="Recent Transactions"
        subtitle="Latest personal and business ledger entries"
        action={
          <div className="flex gap-2">
            <NavLink to="/income" className="text-xs text-indigo-600 font-semibold hover:underline">
              Incomes
            </NavLink>
            <span className="text-slate-300">|</span>
            <NavLink to="/expenses" className="text-xs text-indigo-600 font-semibold hover:underline">
              Expenses
            </NavLink>
          </div>
        }
      >
        {data.recent_transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No transactions recorded yet. Add an income or expense to populate your ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 text-xs font-medium text-slate-500">{tx.type}</td>
                      <td className="py-3 font-semibold text-slate-800">{tx.title}</td>
                      <td className="py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{tx.date}</td>
                      <td
                        className={`py-3 text-right font-bold text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isPositive ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
