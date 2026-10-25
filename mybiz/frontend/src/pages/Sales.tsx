import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Sale, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, ShoppingCart, DollarSign, CheckCircle, Clock, Trash2 } from 'lucide-react';

export const SalesPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'paid',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }]
  });

  const loadData = async () => {
    if (!activeBusiness) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [salesRes, custRes, prodRes] = await Promise.all([
        api.getSales(activeBusiness.id),
        api.getCustomers(activeBusiness.id),
        api.getProducts(activeBusiness.id)
      ]);
      setSales(salesRes);
      setCustomers(custRes);
      setProducts(prodRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const handleProductSelect = (index: number, productIdStr: string) => {
    const prodId = Number(productIdStr);
    const prod = products.find(p => p.id === prodId);
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      product_id: productIdStr,
      unit_price: prod ? prod.price : 0
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], quantity: Math.max(1, qty) };
    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculatedTotal = formData.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      await api.createSale({
        business_id: activeBusiness.id,
        customer_id: formData.customer_id ? Number(formData.customer_id) : undefined,
        date: formData.date,
        status: formData.status,
        items: formData.items.map(i => ({
          product_id: i.product_id ? Number(i.product_id) : undefined,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      });
      setModalOpen(false);
      setFormData({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        items: [{ product_id: '', quantity: 1, unit_price: 0 }]
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record sale');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sale record?')) return;
    try {
      await api.deleteSale(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalPaid = sales.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.total_amount, 0);
  const pendingCount = sales.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sales & Invoicing</h2>
          <p className="text-sm text-slate-500 mt-0.5">Record customer sales, track invoices, and realize revenue.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Record New Sale</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Paid Revenue"
          value={`$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Realized sales cashflow"
          icon={<DollarSign size={20} />}
          color="green"
        />
        <StatCard
          title="Total Invoiced Orders"
          value={sales.length}
          subtitle="All transactions logged"
          icon={<ShoppingCart size={20} />}
          color="brand"
        />
        <StatCard
          title="Pending Payments"
          value={pendingCount}
          subtitle="Unpaid customer invoices"
          icon={<Clock size={20} />}
          color={pendingCount > 0 ? 'amber' : 'green'}
        />
      </div>

      <Card title="Sales Ledger" subtitle={`Orders for ${activeBusiness?.name || 'Default'}`}>
        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales recorded yet"
            description="Create your first invoice or sales transaction to track revenue."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Record First Sale
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => {
                  const cust = customers.find(c => c.id === s.customer_id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-mono text-xs font-bold text-slate-800">INV-{s.id.toString().padStart(4, '0')}</td>
                      <td className="py-3 font-semibold text-slate-800">{cust?.name || 'Direct / Walk-in'}</td>
                      <td className="py-3 text-xs text-slate-500">
                        {s.items?.length || 0} line item{s.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3 text-xs text-slate-400">{s.date}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            s.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ${s.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Sale Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Sales Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Direct / Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="paid">Paid (Funds Received)</option>
                <option value="pending">Pending (Awaiting Payment)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sale Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Line items */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Items</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select product / service...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-xl border border-slate-200 text-xs text-center"
                    placeholder="Qty"
                  />
                  <div className="w-24 text-right text-xs font-bold text-slate-700">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Calculated Total:</span>
              <span className="text-xl font-bold text-indigo-600">${calculatedTotal.toFixed(2)}</span>
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
              Save Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
