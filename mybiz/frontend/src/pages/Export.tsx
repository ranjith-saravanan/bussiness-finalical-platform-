import React from 'react';
import { api } from '../api';
import { Card } from '../components/UI';
import { Download, FileSpreadsheet, Wallet, ArrowDownCircle, ShoppingCart, Users, Package, Briefcase } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const exportItems = [
    {
      id: 'income',
      title: 'Personal Incomes',
      description: 'Export all personal salary, freelance, investment, and recurring income streams to CSV.',
      icon: <Wallet size={24} className="text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-100'
    },
    {
      id: 'expenses',
      title: 'Personal Expenses',
      description: 'Export all personal discretionary, housing, utility, and recurring expenses to CSV.',
      icon: <ArrowDownCircle size={24} className="text-rose-600" />,
      color: 'bg-rose-50 border-rose-100'
    },
    {
      id: 'sales',
      title: 'Sales & Invoices',
      description: 'Export customer invoice records, total amounts, status, and dates for tax accounting.',
      icon: <ShoppingCart size={24} className="text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-100'
    },
    {
      id: 'customers',
      title: 'Customer Directory (CRM)',
      description: 'Export customer rosters, companies, phone numbers, and email contact records.',
      icon: <Users size={24} className="text-blue-600" />,
      color: 'bg-blue-50 border-blue-100'
    },
    {
      id: 'products',
      title: 'Products & Services Catalog',
      description: 'Export product catalog items, billable hourly rates, SKUs, and service descriptions.',
      icon: <Package size={24} className="text-amber-600" />,
      color: 'bg-amber-50 border-amber-100'
    },
    {
      id: 'transactions',
      title: 'Business Transactions (OpEx / Rev)',
      description: 'Export business operating expenses, miscellaneous revenues, and vendor receipts.',
      icon: <Briefcase size={24} className="text-purple-600" />,
      color: 'bg-purple-50 border-purple-100'
    }
  ];

  const handleDownload = async (type: string) => {
    try {
      const token = localStorage.getItem('mybiz_token');
      const response = await fetch(api.getExportUrl(type), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mybiz_${type}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download export');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Export & Portability</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Download structured CSV files of your financial and business data for accountants, spreadsheets, or backups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{item.description}</p>
            </div>

            <button
              onClick={() => handleDownload(item.id)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
