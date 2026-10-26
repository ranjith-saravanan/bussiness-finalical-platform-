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
  DollarSign,
  Building,
  Sparkles,
  PlusCircle,
  Briefcase,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  Receipt,
  Scale,
  CalendarClock
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0.25);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(1000);

  const fetchDashboard = async (rate = taxRate, buffer = safetyBuffer) => {
    try {
      setLoading(true);
      const res = await api.getDashboard(rate, buffer);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(taxRate, safetyBuffer);
  }, []);

  const handleTaxRateChange = (newRate: number) => {
    setTaxRate(newRate);
    fetchDashboard(newRate, safetyBuffer);
  };

  if (loading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-rose-600 font-semibold mb-2">Error loading dashboard</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const comparisonData = [
    { label: 'Personal Inflow/Outflow', value: data.total_personal_income, secondary: data.total_personal_expense },
    { label: 'Business Revenue/OpEx', value: data.business_revenue, secondary: data.business_expenses },
  ];

  const breakdown = data.safe_to_spend_breakdown;
  const fq = data.five_questions;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Welcome Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
            <Sparkles size={13} />
            <span>Financial Decision Cockpit • Solo Founder Edition</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Financial Dashboard</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time isolation between personal liquidity and business operating capital for Apex Digital Studio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/income"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5"
          >
            <PlusCircle size={14} /> + Personal Income
          </NavLink>
          <NavLink
            to="/expenses"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5"
          >
            <PlusCircle size={14} /> + Personal Expense
          </NavLink>
          <NavLink
            to="/sales"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <PlusCircle size={14} /> + Record Client Sale
          </NavLink>
        </div>
      </div>

      {/* 2. Five Decision Questions Bar */}
      {fq && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              5 Key Financial Decision Questions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">1. How much came in?</span>
              <p className="font-bold text-slate-800">${fq['1_money_in']?.total_inflow.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fq['1_money_in']?.summary}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">2. How much went out?</span>
              <p className="font-bold text-rose-600">${fq['2_money_out']?.total_outflow.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fq['2_money_out']?.summary}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">3. What did I keep?</span>
              <p className="font-bold text-emerald-600">${data.net_personal_cashflow.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Biz Profit: ${data.business_profit.toLocaleString()} ({data.business_margin}%)</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">4. Attention Required</span>
              <p className="font-bold text-amber-600 line-clamp-1">{fq['4_attention']?.[0] || 'All healthy'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fq['4_attention']?.length} active notice(s)</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/30">
              <span className="text-[11px] font-medium text-indigo-600 block mb-1">5. Recommended Action</span>
              <p className="font-bold text-indigo-900 line-clamp-2">{fq['5_next_action']}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE P0: Safe to Spend Decision Cockpit */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-indigo-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/20">
              <ShieldCheck size={14} />
              <span>Grounded Decision Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">SAFE PERSONAL SPENDING</h2>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-xl">
              Transparent estimate of discretionary personal cash you can deploy without starving your business, missing recurring commitments, or breaching emergency reserves.
            </p>
          </div>
          <div className="text-left lg:text-right">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold block mb-0.5">
              Estimated Safe Discretionary Limit
            </span>
            <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
              ${data.safe_personal_spending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="inline-block mt-1 text-[11px] text-indigo-200 bg-indigo-800/60 px-2.5 py-0.5 rounded-full border border-indigo-700">
              Estimate — not guaranteed financial advice
            </span>
          </div>
        </div>

        {/* Calculation Components Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-[11px] text-indigo-200 font-medium block mb-1">1. Available Personal Cash</span>
            <div className="text-xl font-bold text-white">
              ${data.available_personal_cash.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300 block mt-1">Cumulative Personal Net</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-[11px] text-indigo-200 font-medium block mb-1">2. Upcoming Commitments</span>
            <div className="text-xl font-bold text-rose-300">
              -${data.upcoming_personal_commitments.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300 block mt-1">Recurring Bills / Budgets</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-[11px] text-indigo-200 font-medium block mb-1">3. Savings Reserve Req.</span>
            <div className="text-xl font-bold text-amber-300">
              -${data.savings_reserve_requirement.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300 block mt-1">Allocated to Goals</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-[11px] text-indigo-200 font-medium block mb-1">4. Safety Buffer</span>
            <div className="text-xl font-bold text-indigo-300">
              -${data.safety_buffer.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300 block mt-1">Emergency Cash Buffer</span>
          </div>
        </div>

        {/* Formula bar callout */}
        <div className="mt-5 p-3.5 bg-black/25 rounded-xl border border-white/10 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale size={15} className="text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">
              {breakdown?.formula || `Available ($${data.available_personal_cash.toLocaleString()}) - Commitments ($${data.upcoming_personal_commitments.toLocaleString()}) - Savings ($${data.savings_reserve_requirement.toLocaleString()}) - Buffer ($${data.safety_buffer.toLocaleString()}) = $${data.safe_personal_spending.toLocaleString()}`}
            </span>
          </div>
          <NavLink
            to="/ai-advisor"
            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 shrink-0"
          >
            Ask AI: "Can I afford...?" →
          </NavLink>
        </div>
      </div>

      {/* 4. REALM 1: Personal Finance & Liquidity */}
      <div className="border-2 border-indigo-100 rounded-3xl p-6 bg-indigo-50/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
              Personal Realm
            </span>
            <h3 className="text-base font-bold text-slate-800">Personal Cash Flow & Liquidity</h3>
          </div>
          <NavLink to="/cashflow" className="text-xs text-indigo-600 font-semibold hover:underline">
            View Cash Flow Ledger →
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Personal Income"
            value={`$${data.total_personal_income.toLocaleString()}`}
            subtitle="Recorded personal earnings"
            icon={<Wallet size={20} />}
            color="brand"
          />

          <StatCard
            title="Personal Expenses"
            value={`$${data.total_personal_expense.toLocaleString()}`}
            subtitle="Recorded personal living spend"
            icon={<ArrowDownCircle size={20} />}
            color="red"
          />

          <StatCard
            title="Personal Net Cash Flow"
            value={`$${data.net_personal_cashflow.toLocaleString()}`}
            subtitle={data.net_personal_cashflow >= 0 ? 'Liquid personal cash retained' : 'Personal spending deficit'}
            icon={<TrendingUp size={20} />}
            color={data.net_personal_cashflow >= 0 ? 'green' : 'red'}
          />

          <StatCard
            title="Active Savings Goals"
            value={`$${data.total_savings_current.toLocaleString()}`}
            subtitle={`Target: $${data.total_savings_target.toLocaleString()}`}
            icon={<PiggyBank size={20} />}
            color="brand"
          />
        </div>
      </div>

      {/* 5. REALM 2: Business Performance & Operations */}
      <div className="border-2 border-amber-100 rounded-3xl p-6 bg-amber-50/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
              Business Realm
            </span>
            <h3 className="text-base font-bold text-slate-800">Apex Digital Studio Operating Performance</h3>
          </div>
          <NavLink to="/business" className="text-xs text-amber-700 font-semibold hover:underline">
            Manage Business & Sales →
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Business Revenue"
            value={`$${data.business_revenue.toLocaleString()}`}
            subtitle="Customer sales & invoiced revenue"
            icon={<Building size={20} />}
            color="blue"
          />

          <StatCard
            title="Business Expenses (OpEx)"
            value={`$${data.business_expenses.toLocaleString()}`}
            subtitle="Hosting, software, contractors"
            icon={<Briefcase size={20} />}
            color="amber"
          />

          <StatCard
            title="Business Net Profit"
            value={`$${data.business_profit.toLocaleString()}`}
            subtitle={`Operating Margin: ${data.business_margin}%`}
            icon={<TrendingUp size={20} />}
            color={data.business_profit >= 0 ? 'green' : 'red'}
          />

          {/* Tax Reserve Planning Card */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Tax Reserve</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {Math.round(taxRate * 100)}% Rate
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${data.suggested_tax_reserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Recommended set-aside from profit.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {[0.20, 0.25, 0.30].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleTaxRateChange(rate)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition ${
                    taxRate === rate
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {Math.round(rate * 100)}%
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">
              Estimate only — not certified tax advice.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Comparison Chart & Monthly Budget Pacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Inflow vs Outflow Across Realms"
          subtitle="Comparison of Personal earnings and Business sales vs expenses"
          className="lg:col-span-2"
        >
          <div className="flex items-center gap-4 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Inflow / Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Outflow / Expenses
            </span>
          </div>
          <SimpleBarChart data={comparisonData} height={200} />
        </Card>

        {/* Budget Utilization & Pacing */}
        <Card
          title="Current Month Budget"
          subtitle="Spent vs allocated limits"
          action={
            <NavLink to="/budgets" className="text-xs text-indigo-600 font-semibold hover:underline">
              View All
            </NavLink>
          }
        >
          <div className="space-y-5 pt-2">
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

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
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
            </div>

            <NavLink
              to="/ai-advisor"
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Sparkles size={14} />
              <span>Ask AI: Can I afford $2,000 this month?</span>
            </NavLink>
          </div>
        </Card>
      </div>

      {/* 7. Recent Transactions List */}
      <Card
        title="Recent Ledger Transactions"
        subtitle="Chronological transaction feed clearly tagged with realm origin"
        action={
          <div className="flex gap-2">
            <NavLink to="/income" className="text-xs text-indigo-600 font-semibold hover:underline">
              Incomes
            </NavLink>
            <span className="text-slate-300">|</span>
            <NavLink to="/expenses" className="text-xs text-indigo-600 font-semibold hover:underline">
              Expenses
            </NavLink>
            <span className="text-slate-300">|</span>
            <NavLink to="/sales" className="text-xs text-indigo-600 font-semibold hover:underline">
              Sales
            </NavLink>
          </div>
        }
      >
        {data.recent_transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No transactions recorded yet. Add an income, expense, or client sale to populate your ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Realm / Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  const isPersonal = tx.type.toLowerCase().includes('personal') || tx.type.toLowerCase().includes('income') || tx.type.toLowerCase().includes('expense');
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPersonal ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{tx.title}</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
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
