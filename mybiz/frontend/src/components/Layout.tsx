import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Bell,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LineChart
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, businesses, activeBusiness, setActiveBusiness, unreadCount, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Personal Finance',
      items: [
        { name: 'Income', path: '/income', icon: Wallet },
        { name: 'Expenses', path: '/expenses', icon: ArrowDownCircle },
        { name: 'Budgets', path: '/budgets', icon: PieChart },
        { name: 'Savings Goals', path: '/savings', icon: PiggyBank },
        { name: 'Cash Flow', path: '/cashflow', icon: TrendingUp }
      ]
    },
    {
      title: 'Business Hub',
      items: [
        { name: 'Businesses', path: '/business', icon: Building2 },
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Products & Services', path: '/products', icon: Package },
        { name: 'Sales & Invoices', path: '/sales', icon: ShoppingCart }
      ]
    },
    {
      title: 'Intelligence & Growth',
      items: [
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Forecasting', path: '/forecast', icon: LineChart },
        { name: 'AI Advisor', path: '/ai-advisor', icon: Sparkles }
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
        { name: 'Export Data', path: '/export', icon: Download },
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              M
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">MyBIZ</span>
              <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">Business Advisor</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
                {sec.title}
              </h4>
              <ul className="space-y-1">
                {sec.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <li key={itemIdx}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User bar in sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>

            {/* Active Business Switcher */}
            {businesses.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                >
                  <Building2 size={14} className="text-indigo-600" />
                  <span className="font-semibold">{activeBusiness?.name || 'Select Business'}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {bizDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active Business
                    </div>
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveBusiness(b);
                          setBizDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          activeBusiness?.id === b.id ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-600'
                        }`}
                      >
                        <span>{b.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{b.currency}</span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <NavLink
                        to="/business"
                        onClick={() => setBizDropdownOpen(false)}
                        className="block px-3 py-1.5 text-xs text-indigo-600 font-medium hover:bg-slate-50"
                      >
                        + Manage Businesses
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl relative transition"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </NavLink>
            <NavLink
              to="/ai-advisor"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition"
            >
              <Sparkles size={14} />
              <span>Ask Advisor</span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-slate-300 h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-lg font-bold text-white">MyBIZ</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 space-y-4">
              {navSections.map((sec, idx) => (
                <div key={idx}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {sec.title}
                  </h4>
                  <ul className="space-y-1">
                    {sec.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      return (
                        <li key={itemIdx}>
                          <NavLink
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${
                                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                              }`
                            }
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
              <span className="text-xs text-slate-400">{user?.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
