import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, StatCard, SimpleBarChart, LoadingSpinner, EmptyState } from '../components/UI';
import { TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

export const CashFlowPage: React.FC = () => {
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCashflow = async () => {
    try {
      setLoading(true);
      const res = await api.getCashFlow();
      setCashflow(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashflow();
  }, []);

  const totalIn = cashflow.reduce((acc, c) => acc + c.income, 0);
  const totalOut = cashflow.reduce((acc, c) => acc + c.expense, 0);
  const totalNet = totalIn - totalOut;

  const chartData = cashflow.map(c => ({
    label: c.month,
    value: c.income,
    secondary: c.expense
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cash-Flow Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">Monitor liquidity timelines, net cash generation, and operating runway.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Lifetime Cash Generated"
          value={`$${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Cumulative inbound cash"
          icon={<ArrowUpRight size={20} />}
          color="brand"
        />
        <StatCard
          title="Lifetime Cash Consumed"
          value={`$${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Cumulative outbound cash"
          icon={<ArrowDownRight size={20} />}
          color="red"
        />
        <StatCard
          title="Cumulative Net Balance"
          value={`$${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={totalNet >= 0 ? 'Surplus liquid position' : 'Cumulative deficit'}
          icon={<DollarSign size={20} />}
          color={totalNet >= 0 ? 'green' : 'red'}
        />
      </div>

      <Card title="Monthly Cash Inflow vs Outflow" subtitle="Comparative analysis across operating months">
        <div className="flex items-center gap-4 text-xs font-semibold mb-4">
          <span className="flex items-center gap-1.5 text-indigo-600">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Inflow (Income)
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Outflow (Expenses)
          </span>
        </div>
        <SimpleBarChart data={chartData} height={200} />
      </Card>

      <Card title="Historical Cash Flow Register" subtitle="Month-by-month financial ledger reconciliation">
        {loading ? (
          <LoadingSpinner />
        ) : cashflow.length === 0 ? (
          <EmptyState
            title="No cash flow data yet"
            description="Record incomes and expenses to see your monthly cash flow progression."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Month</th>
                  <th className="pb-3 text-right">Inflow ($)</th>
                  <th className="pb-3 text-right">Outflow ($)</th>
                  <th className="pb-3 text-right">Net Flow ($)</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashflow.map((row, idx) => {
                  const isPositive = row.net >= 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-semibold text-slate-800">{row.month}</td>
                      <td className="py-3 text-right text-emerald-600 font-semibold">
                        +${row.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right text-slate-900 font-semibold">
                        -${row.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+$${row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(row.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPositive ? 'Surplus' : 'Deficit'}
                        </span>
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
