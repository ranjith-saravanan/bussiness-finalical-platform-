import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BudgetStatus } from '../types';
import { Card, StatCard, ProgressBar, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, PieChart, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [formData, setFormData] = useState({
    category: 'Housing',
    amount: '',
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.getBudgetStatus(selectedMonth, selectedYear);
      setBudgets(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year)
      });
      setModalOpen(false);
      setFormData({
        category: 'Housing',
        amount: '',
        month: selectedMonth,
        year: selectedYear
      });
      loadBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this budget limit?')) return;
    try {
      await api.deleteBudget(id);
      loadBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent > b.allocated).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Budget Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define spending caps by category and prevent overspending.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span>Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-indigo-600 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
            <span>{selectedYear}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Budget Allocated"
          value={`$${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Monthly planned cap"
          icon={<PieChart size={20} />}
          color="brand"
        />
        <StatCard
          title="Actual Spent"
          value={`$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(0) : 0}% of monthly limit`}
          icon={<CheckCircle size={20} />}
          color={totalSpent > totalAllocated ? 'red' : 'green'}
        />
        <StatCard
          title="Exceeded Limits"
          value={overBudgetCount}
          subtitle={overBudgetCount === 0 ? 'All budgets healthy' : 'Categories exceeding cap'}
          icon={<AlertTriangle size={20} />}
          color={overBudgetCount === 0 ? 'green' : 'red'}
        />
      </div>

      <Card title="Monthly Category Utilization" subtitle={`Active status for Month ${selectedMonth}, ${selectedYear}`}>
        {loading ? (
          <LoadingSpinner />
        ) : budgets.length === 0 ? (
          <EmptyState
            title="No budgets configured for this month"
            description="Establish category limits to track actual spending versus your target limits."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Create Budget Limit
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {budgets.map((b) => {
              const isOver = b.spent > b.allocated;
              const barColor = isOver ? 'bg-rose-500' : b.percentage > 80 ? 'bg-amber-500' : 'bg-indigo-600';
              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-800 text-sm">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isOver
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : b.percentage > 80
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {b.percentage.toFixed(0)}%
                      </span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete limit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <ProgressBar
                    value={b.spent}
                    max={b.allocated}
                    color={barColor}
                    showLabel={false}
                  />

                  <div className="flex justify-between items-center text-xs mt-3 text-slate-500">
                    <span>
                      Spent: <strong className="text-slate-800">${b.spent.toLocaleString()}</strong> ({b.percentage.toFixed(1)}%)
                    </span>
                    <span>
                      Remaining: <strong className={b.remaining >= 0 ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>${b.remaining.toLocaleString()}</strong>
                    </span>
                  </div>

                  {/* Budget Pacing & Projections */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div>
                      Days Remaining: <strong className="text-slate-700">{b.days_remaining ?? 0} days</strong>
                    </div>
                    <div className="text-right">
                      Projected Month-End: <strong className="text-slate-700">${b.projected_month_end?.toLocaleString() ?? b.spent.toLocaleString()}</strong>
                    </div>
                    {b.potential_overspend && b.potential_overspend > 0 ? (
                      <div className="col-span-2 text-rose-600 font-medium bg-rose-50/60 px-2 py-1 rounded-md text-[10px]">
                        ⚠️ Potential Overspend: ${b.potential_overspend.toLocaleString()} (Estimated run-rate)
                      </div>
                    ) : (
                      <div className="col-span-2 text-emerald-700 font-medium bg-emerald-50/60 px-2 py-1 rounded-md text-[10px]">
                        ✓ On Track to stay within monthly cap
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Set Budget Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Category Budget">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Housing">Housing / Rent / Mortgage</option>
              <option value="Food & Groceries">Food & Groceries</option>
              <option value="Transportation">Transportation & Fuel</option>
              <option value="Utilities">Utilities & Phone</option>
              <option value="Health">Healthcare & Insurance</option>
              <option value="Entertainment">Entertainment & Subscriptions</option>
              <option value="Technology">Technology & Hardware</option>
              <option value="General">General / Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Spending Cap ($)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 800.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>Month {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Save Budget
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
