import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Savings } from '../types';
import { Card, StatCard, ProgressBar, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, PiggyBank, Target, Calendar, Edit3, Trash2 } from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Savings | null>(null);
  const [updateAmount, setUpdateAmount] = useState('');

  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '0',
    target_date: ''
  });

  const loadSavings = async () => {
    try {
      setLoading(true);
      const res = await api.getSavings();
      setSavings(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSavings({
        goal_name: formData.goal_name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        target_date: formData.target_date || undefined
      });
      setModalOpen(false);
      setFormData({
        goal_name: '',
        target_amount: '',
        current_amount: '0',
        target_date: ''
      });
      loadSavings();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleUpdateCurrentAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await api.updateSavings(selectedGoal.id, parseFloat(updateAmount));
      setUpdateModalOpen(false);
      setSelectedGoal(null);
      setUpdateAmount('');
      loadSavings();
    } catch (err: any) {
      alert(err.message || 'Failed to update savings amount');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this savings goal?')) return;
    try {
      await api.deleteSavings(id);
      loadSavings();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalCurrent = savings.reduce((acc, s) => acc + s.current_amount, 0);
  const totalTarget = savings.reduce((acc, s) => acc + s.target_amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Savings Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define emergency reserves, vacation funds, and long-term targets.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>New Savings Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Saved"
          value={`$${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="All active deposits"
          icon={<PiggyBank size={20} />}
          color="brand"
        />
        <StatCard
          title="Total Target"
          value={`$${totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Cumulative target capital"
          icon={<Target size={20} />}
          color="blue"
        />
        <StatCard
          title="Overall Goal Progress"
          value={`${totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}%`}
          subtitle={`$${Math.max(0, totalTarget - totalCurrent).toLocaleString()} remaining to target`}
          icon={<PiggyBank size={20} />}
          color="green"
        />
      </div>

      <Card title="Active Savings Goals" subtitle="Track progress and deposit funds toward your milestones">
        {loading ? (
          <LoadingSpinner />
        ) : savings.length === 0 ? (
          <EmptyState
            title="No savings goals created"
            description="Establish an emergency fund or long-term purchase target to begin tracking."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Create Savings Goal
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {savings.map((goal) => {
              const pct = (goal.current_amount / goal.target_amount) * 100;
              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{goal.goal_name}</h4>
                        {goal.target_date && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} /> Target: {goal.target_date}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedGoal(goal);
                            setUpdateAmount(goal.current_amount.toString());
                            setUpdateModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Update Balance"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          title="Delete Goal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="my-3">
                      <ProgressBar
                        value={goal.current_amount}
                        max={goal.target_amount}
                        color={pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}
                        showLabel={false}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 text-xs text-slate-500 mt-2">
                    <div>
                      Saved: <strong className="text-slate-900">${goal.current_amount.toLocaleString()}</strong>
                    </div>
                    <div>
                      Target: <strong className="text-slate-900">${goal.target_amount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Savings Goal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 6-Month Emergency Runway, New Laptop"
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="10000.00"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Saved ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Completion Date (Optional)</label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Balance Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={`Update Balance: ${selectedGoal?.goal_name}`}
      >
        <form onSubmit={handleUpdateCurrentAmount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Balance ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={updateAmount}
              onChange={(e) => setUpdateAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target: ${selectedGoal?.target_amount.toLocaleString()}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Update Balance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
