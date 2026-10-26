import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Notification } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, LoadingSpinner, EmptyState } from '../components/UI';
import { Bell, CheckCheck, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle2, Filter } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const { setUnreadCount } = useAuth();

  const categories = ['ALL', 'BUDGET', 'CASH_FLOW', 'SAVINGS', 'BUSINESS', 'EXPENSE', 'FORECAST'];

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res);
      setUnreadCount(res.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleEvaluate = async () => {
    try {
      setLoading(true);
      const res = await api.generateNotifications();
      setNotifications(res);
      setUnreadCount(res.filter((n: any) => !n.is_read).length);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger rule evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(notifications.filter(n => !n.is_read && n.id !== id).length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'ALL') return true;
    return (n.category || 'GENERAL').toUpperCase() === activeCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Notification Center</h2>
          <p className="text-sm text-slate-500 mt-0.5">Automated rule-based alerts for budgets, cash flow, tax reserves, and goals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Scan Financial Rules</span>
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Filter size={14} className="text-slate-400 shrink-0 ml-1 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card title="Alert Feed" subtitle={`Showing ${filteredNotifications.length} notification(s)`}>
        {loading ? (
          <LoadingSpinner />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            title="All clear! No notifications in this category."
            description="Run a rule scan or add transactions to test budget alerts and milestones."
            action={
              <button
                onClick={handleEvaluate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Scan Rules Now
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => {
              const iconMap: Record<string, React.ReactNode> = {
                alert: <AlertCircle size={18} className="text-rose-500" />,
                warning: <AlertTriangle size={18} className="text-amber-500" />,
                info: <Info size={18} className="text-indigo-500" />,
                success: <CheckCircle2 size={18} className="text-emerald-500" />
              };

              return (
                <div
                  key={n.id}
                  className={`py-4 px-3 flex items-start justify-between gap-4 transition rounded-xl ${
                    n.is_read ? 'opacity-60 bg-transparent' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 shrink-0">
                      {iconMap[n.type] || <Info size={18} className="text-indigo-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-700 uppercase">
                          {n.category || 'GENERAL'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">{n.created_at}</span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs font-semibold text-indigo-600 hover:underline shrink-0"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
