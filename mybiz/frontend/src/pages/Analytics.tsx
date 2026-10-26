import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, SimpleBarChart, ProgressBar, LoadingSpinner } from '../components/UI';
import { BarChart3, TrendingUp, DollarSign, PieChart, Layers } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [personalData, setPersonalData] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [pRes, bRes] = await Promise.all([
        api.getPersonalAnalytics(),
        api.getBusinessAnalytics(activeBusiness?.id)
      ]);
      setPersonalData(pRes);
      setBusinessData(bRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [activeBusiness]);

  if (loading) return <LoadingSpinner />;

  const trendChartData = (personalData?.monthly_trend || []).map((t: any) => ({
    label: t.month,
    value: t.income,
    secondary: t.expense
  }));

  const bizTrendData = (businessData?.monthly_business_trend || []).map((t: any) => ({
    label: t.month,
    value: t.revenue,
    secondary: t.expense
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial & Business Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Real-time analytical insights derived from your actual database records.</p>
      </div>

      {/* Business KPIs Header */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Business Operating Health ({activeBusiness?.name || 'All Entities'})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`$${(businessData?.total_revenue || 0).toLocaleString()}`}
            subtitle="Verified client sales & inflow"
            icon={<DollarSign size={20} />}
            color="brand"
          />
          <StatCard
            title="Operating Expenses"
            value={`$${(businessData?.total_expenses || 0).toLocaleString()}`}
            subtitle="Overhead & contractor costs"
            icon={<Layers size={20} />}
            color="red"
          />
          <StatCard
            title="Net Business Profit"
            value={`$${(businessData?.net_profit || 0).toLocaleString()}`}
            subtitle="Bottom line earnings"
            icon={<TrendingUp size={20} />}
            color={(businessData?.net_profit || 0) >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Operating Margin"
            value={`${businessData?.profit_margin || 0}%`}
            subtitle="Profitability efficiency"
            icon={<PieChart size={20} />}
            color={(businessData?.profit_margin || 0) >= 20 ? 'green' : 'amber'}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Cash Flow Trend */}
        <Card
          title="Personal Cash Flow Evolution"
          subtitle="Monthly Income vs Expenses"
        >
          <div className="flex items-center gap-4 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Expenses
            </span>
          </div>
          <SimpleBarChart data={trendChartData} height={180} />
        </Card>

        {/* Business Revenue vs Expense */}
        <Card
          title="Business Performance Trend"
          subtitle="Monthly Revenue vs Operating Expenses"
        >
          <div className="flex items-center gap-4 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Expenses
            </span>
          </div>
          <SimpleBarChart data={bizTrendData} height={180} />
        </Card>
      </div>

      {/* Business & Customer Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Leaderboard */}
        <Card title="Top Client Revenue Contribution" subtitle="High-value client relationships">
          <div className="space-y-3 pt-2">
            {(businessData?.top_customers || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No client sales recorded yet</p>
            ) : (
              businessData.top_customers.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{c.name}</h5>
                    <p className="text-[11px] text-slate-500">{c.company} • {c.sales_count} sale(s)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">${c.total_revenue.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">AOV: ${c.average_sale_value.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Revenue by Product / Service */}
        <Card title="Top Products & Services" subtitle="Revenue breakdown by offering">
          <div className="space-y-3 pt-2">
            {(businessData?.revenue_by_product || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No product sales recorded yet</p>
            ) : (
              businessData.revenue_by_product.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-800">{p.name}</h5>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.units_sold} unit(s) sold @ ${p.price}</p>
                  </div>
                  <div className="text-right font-bold text-slate-900">
                    ${p.total_revenue.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Category Breakdowns & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Expense Categories */}
        <Card title="Spending by Category" subtitle="Personal outflow concentration">
          <div className="space-y-3 pt-2">
            {(personalData?.expense_breakdown || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No expenses logged yet</p>
            ) : (
              personalData.expense_breakdown.map((cat: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-xs">
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="font-bold text-slate-900">${cat.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Budget Utilization Status */}
        <Card title="Budget Compliance" subtitle="Spent vs allocated threshold">
          <div className="space-y-4 pt-2">
            {(personalData?.budget_utilization || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No budgets configured</p>
            ) : (
              personalData.budget_utilization.map((b: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{b.category}</span>
                    <span className="text-slate-500">${b.spent} / ${b.allocated} ({b.percentage}%)</span>
                  </div>
                  <ProgressBar
                    value={b.spent}
                    max={b.allocated}
                    color={b.percentage > 100 ? 'bg-rose-500' : b.percentage > 80 ? 'bg-amber-500' : 'bg-indigo-600'}
                    showLabel={false}
                  />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Savings Goal Progress */}
        <Card title="Savings Milestones" subtitle="Target achievement status">
          <div className="space-y-4 pt-2">
            {(personalData?.savings_progress || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No savings goals created</p>
            ) : (
              personalData.savings_progress.map((s: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{s.goal}</span>
                    <span className="text-slate-500">${s.current} / ${s.target} ({s.percentage}%)</span>
                  </div>
                  <ProgressBar
                    value={s.current}
                    max={s.target}
                    color={s.percentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}
                    showLabel={false}
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
