import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Modal, LoadingSpinner, EmptyState } from '../components/UI';
import { PlusCircle, Package, Tag, Layers, Trash2 } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'service',
    sku: '',
    description: ''
  });

  const loadProducts = async () => {
    if (!activeBusiness) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getProducts(activeBusiness.id);
      setProducts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      await api.createProduct({
        ...formData,
        business_id: activeBusiness.id,
        price: parseFloat(formData.price)
      });
      setModalOpen(false);
      setFormData({ name: '', price: '', type: 'service', sku: '', description: '' });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to add product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product/service?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const servicesCount = products.filter(p => p.type === 'service').length;
  const physicalCount = products.filter(p => p.type === 'product').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Products & Services Catalog</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your offerings, standard billable rates, and SKUs.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Add Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Catalog Offerings"
          value={products.length}
          subtitle="Configured items"
          icon={<Package size={20} />}
          color="brand"
        />
        <StatCard
          title="Services / Retainers"
          value={servicesCount}
          subtitle="Hourly / Fixed rate services"
          icon={<Tag size={20} />}
          color="blue"
        />
        <StatCard
          title="Physical / Digital Products"
          value={physicalCount}
          subtitle="Inventory & asset items"
          icon={<Layers size={20} />}
          color="green"
        />
      </div>

      <Card title="Product Catalog" subtitle={`Active items for ${activeBusiness?.name || 'Default'}`}>
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            title="No items in catalog"
            description="Add your first consulting service or product offering to begin generating invoices."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                + Add Item
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          p.type === 'service' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-mono text-slate-500">{p.sku || '—'}</td>
                    <td className="py-3 text-xs text-slate-400 max-w-xs truncate">{p.description || '—'}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDelete(p.id)}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Product or Service">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. SEO Audit, Enterprise Subscription"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="service">Service / Retainer</option>
                <option value="product">Physical / Digital Product</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">SKU / Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. SRV-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Item deliverables, scope, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Save Offering
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
