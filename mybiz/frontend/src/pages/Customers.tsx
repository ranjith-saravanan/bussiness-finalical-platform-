import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, Users, Mail, Phone, Building, Trash2 } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active'
  });

  const loadCustomers = async () => {
    if (!activeBusiness) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getCustomers(activeBusiness.id);
      setCustomers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      await api.createCustomer({
        ...formData,
        business_id: activeBusiness.id
      });
      setModalOpen(false);
      setFormData({ name: '', email: '', phone: '', company: '', status: 'active' });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const activeCount = customers.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Directory (CRM)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage customer profiles and invoice contacts for {activeBusiness?.name}.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered clients"
          icon={<Users size={20} />}
          color="brand"
        />
        <StatCard
          title="Active Accounts"
          value={activeCount}
          subtitle="Currently active relationships"
          icon={<Users size={20} />}
          color="green"
        />
        <StatCard
          title="Lead Pipeline"
          value={customers.filter(c => c.status === 'lead').length}
          subtitle="Prospective clients"
          icon={<Building size={20} />}
          color="amber"
        />
      </div>

      <Card title="Customer Roster" subtitle={`Contacts belonging to ${activeBusiness?.name || 'Default'}`}>
        {loading ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers added yet"
            description="Create your first client record to assign invoices and record sales."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Add Customer
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-3 text-xs text-slate-600 font-medium">{c.company || 'Individual'}</td>
                    <td className="py-3 text-xs text-slate-500">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" /> {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone size={12} className="text-slate-400" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDelete(c.id)}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Customer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Customer / Contact Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active Client</option>
                <option value="lead">Lead / Prospect</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
