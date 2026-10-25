import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Business, BusinessTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, Building2, Briefcase, Trash2, CheckCircle2 } from 'lucide-react';

export const BusinessPage: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness, refreshBusinesses } = useAuth();
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bizModalOpen, setBizModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const [bizForm, setBizForm] = useState({
    name: '',
    industry: 'Technology',
    currency: 'USD'
  });

  const [txForm, setTxForm] = useState({
    business_id: activeBusiness?.id || 0,
    type: 'expense',
    category: 'Software & Tools',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadTransactions = async () => {
    if (!activeBusiness) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getBusinessTransactions(activeBusiness.id);
      setTransactions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    if (activeBusiness) {
      setTxForm(prev => ({ ...prev, business_id: activeBusiness.id }));
    }
  }, [activeBusiness]);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBusiness(bizForm);
      setBizModalOpen(false);
      setBizForm({ name: '', industry: 'Technology', currency: 'USD' });
      await refreshBusinesses();
    } catch (err: any) {
      alert(err.message || 'Failed to create business');
    }
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      await api.createBusinessTransaction({
        ...txForm,
        business_id: activeBusiness.id,
        amount: parseFloat(txForm.amount)
      });
      setTxModalOpen(false);
      setTxForm({
        business_id: activeBusiness.id,
        type: 'expense',
        category: 'Software & Tools',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      loadTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to record transaction');
    }
  };

  const handleDeleteTx = async (id: number) => {
    if (!confirm('Delete this business transaction?')) return;
    try {
      await api.deleteBusinessTransaction(id);
      loadTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalRev = transactions.filter(t => t.type === 'revenue').reduce((acc, t) => acc + t.amount, 0);
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Business Hub & Operations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage entity profiles, operating OpEx, and cross-venture accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBizModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
          >
            <Building2 size={16} />
            <span>+ New Business</span>
          </button>
          <button
            onClick={() => setTxModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>+ Log OpEx/Revenue</span>
          </button>
        </div>
      </div>

      {/* Business Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {businesses.map((b) => {
          const isActive = activeBusiness?.id === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setActiveBusiness(b)}
              className={`p-5 rounded-2xl border cursor-pointer transition ${
                isActive
                  ? 'bg-indigo-50/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {b.industry} • {b.currency}
                  </span>
                  <h4 className="text-base font-bold text-slate-800 mt-0.5">{b.name}</h4>
                </div>
                {isActive && <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />}
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                {isActive ? 'Current Active Entity' : 'Click to Switch Entity'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Direct Business Revenue"
          value={`$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Non-sales miscellaneous revenue"
          icon={<Briefcase size={20} />}
          color="green"
        />
        <StatCard
          title="Business Operating Expenses (OpEx)"
          value={`$${totalExp.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Direct operational overhead"
          icon={<Briefcase size={20} />}
          color="amber"
        />
      </div>

      <Card
        title={`Operating Ledger: ${activeBusiness?.name || 'All'}`}
        subtitle="Business operational transactions and vendor expenses"
      >
        {loading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No business transactions logged"
            description="Log business expenses (rent, marketing, software, contractors) or ad-hoc revenues."
            action={
              <button
                onClick={() => setTxModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Log Transaction
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          t.type === 'revenue' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-800">{t.category}</td>
                    <td className="py-3 text-xs text-slate-500 max-w-xs truncate">{t.description || '—'}</td>
                    <td className="py-3 text-xs text-slate-400">{t.date}</td>
                    <td
                      className={`py-3 text-right font-bold ${
                        t.type === 'revenue' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {t.type === 'revenue' ? `+$${t.amount.toFixed(2)}` : `-$${t.amount.toFixed(2)}`}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDeleteTx(t.id)}
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

      {/* New Business Modal */}
      <Modal isOpen={bizModalOpen} onClose={() => setBizModalOpen(false)} title="Register Business Entity">
        <form onSubmit={handleCreateBusiness} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Digital LLC"
              value={bizForm.name}
              onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Industry</label>
              <input
                type="text"
                placeholder="e.g. Consulting, SaaS, Retail"
                value={bizForm.industry}
                onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
              <select
                value={bizForm.currency}
                onChange={(e) => setBizForm({ ...bizForm, currency: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBizModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Save Entity
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Transaction Modal */}
      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title="Record Business Transaction">
        <form onSubmit={handleCreateTx} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Type</label>
              <select
                value={txForm.type}
                onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="expense">Operating Expense (OpEx)</option>
                <option value="revenue">Direct Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <input
                type="text"
                required
                placeholder="e.g. Legal, SaaS, Contractors"
                value={txForm.category}
                onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Vendor invoice, contract reference..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTxModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
