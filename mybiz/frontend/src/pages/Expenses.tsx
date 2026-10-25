import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Expense } from '../types';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, ArrowDownCircle, Trash2, Repeat, Tag } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Housing',
    is_recurring: false,
    notes: ''
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses();
      setExpenses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setModalOpen(false);
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Housing',
        is_recurring: false,
        notes: ''
      });
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to add expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const recurringTotal = expenses.filter(e => e.is_recurring).reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Expense Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control discretionary, housing, food, and recurring subscriptions.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Outflow"
          value={`$${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="All recorded expenses"
          icon={<ArrowDownCircle size={20} />}
          color="red"
        />
        <StatCard
          title="Recurring Monthly"
          value={`$${recurringTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Fixed commitments & bills"
          icon={<Repeat size={20} />}
          color="amber"
        />
        <StatCard
          title="Average Expense"
          value={`$${(expenses.length ? totalExpense / expenses.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${expenses.length} transactions`}
          icon={<Tag size={20} />}
          color="brand"
        />
      </div>

      <Card title="Personal Expense Register" subtitle="Detailed transaction records">
        {loading ? (
          <LoadingSpinner />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses logged"
            description="Log your daily or recurring expenses to start tracking cash flow."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
              >
                + Add First Expense
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{exp.title}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {exp.is_recurring ? (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Repeat size={12} /> Recurring
                        </span>
                      ) : (
                        'One-off'
                      )}
                    </td>
                    <td className="py-3 text-xs text-slate-500">{exp.date}</td>
                    <td className="py-3 text-xs text-slate-400 max-w-xs truncate">{exp.notes || '—'}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      -${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Rent, Grocery Store, SaaS Subscription"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring_exp"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="is_recurring_exp" className="text-xs font-medium text-slate-700">
              Recurring monthly commitment
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Receipt details, split items, etc."
            />
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
