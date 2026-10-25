import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Income } from '../types';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, Wallet, Trash2, Repeat, DollarSign } from 'lucide-react';

export const IncomePage: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Salary',
    is_recurring: false,
    notes: ''
  });

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const res = await api.getIncomes();
      setIncomes(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIncome({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setModalOpen(false);
      setFormData({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Salary',
        is_recurring: false,
        notes: ''
      });
      loadIncomes();
    } catch (err: any) {
      alert(err.message || 'Failed to add income');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await api.deleteIncome(id);
      loadIncomes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const recurringTotal = incomes.filter(i => i.is_recurring).reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Income Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track personal salary, consulting, investments, and recurring streams.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Add Income</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="All recorded earnings"
          icon={<Wallet size={20} />}
          color="brand"
        />
        <StatCard
          title="Recurring Monthly"
          value={`$${recurringTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Fixed recurring cashflow"
          icon={<Repeat size={20} />}
          color="green"
        />
        <StatCard
          title="Average Entry"
          value={`$${(incomes.length ? totalIncome / incomes.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${incomes.length} total entries`}
          icon={<DollarSign size={20} />}
          color="blue"
        />
      </div>

      <Card title="Income Ledger" subtitle="Detailed historical earnings breakdown">
        {loading ? (
          <LoadingSpinner />
        ) : incomes.length === 0 ? (
          <EmptyState
            title="No income recorded yet"
            description="Start by adding your primary salary or revenue stream."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Add First Income
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{inc.source}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {inc.category}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {inc.is_recurring ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Repeat size={12} /> Recurring
                        </span>
                      ) : (
                        'One-off'
                      )}
                    </td>
                    <td className="py-3 text-xs text-slate-500">{inc.date}</td>
                    <td className="py-3 text-xs text-slate-400 max-w-xs truncate">{inc.notes || '—'}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">
                      +${inc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDelete(inc.id)}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record New Income">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Source / Employer</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp, Client Consulting"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Salary">Salary</option>
              <option value="Consulting">Consulting / Freelance</option>
              <option value="Investments">Investments / Dividends</option>
              <option value="Rental">Rental Income</option>
              <option value="Side Hustle">Side Hustle</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring_inc"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_recurring_inc" className="text-xs font-medium text-slate-700">
              Recurring monthly income stream
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Contract terms, bonuses, etc."
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Save Income
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
