import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Badge } from '../components/UI';
import { User, Shield, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, activeBusiness } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System & Account Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage user credentials, business defaults, and system preferences.</p>
      </div>

      <Card title="User Profile" subtitle="Authenticated identity details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{user?.full_name}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{user?.email}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Business Entity</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{activeBusiness?.name || 'Default'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Default Currency</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{activeBusiness?.currency || 'USD'} ($)</p>
          </div>
        </div>
      </Card>

      <Card title="AI Intelligence Engine" subtitle="Advisory model connectivity">
        <div className="space-y-4 pt-2">
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Gemini 1.5 Flash / Rule-Based Copilot</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  MyBIZ operates with a dual intelligence pipeline: when <code>GEMINI_API_KEY</code> is configured in your backend <code>.env</code>, it provides natural language reasoning. If no key is set, it automatically utilizes our deterministic financial advisory algorithm so all features remain 100% operational offline.
                </p>
              </div>
            </div>
            <Badge variant="success">ACTIVE</Badge>
          </div>
        </div>
      </Card>

      <Card title="Security & Architecture" subtitle="Protection protocols and database guarantees">
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span><strong>Bcrypt Password Encryption:</strong> Passwords are salt-hashed before persistence.</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
            <span><strong>Stateless JWT Authentication:</strong> API routes are protected by cryptographically signed tokens.</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
            <Database size={16} className="text-slate-500 shrink-0" />
            <span><strong>Isolated Storage:</strong> SQLite database with strict foreign-key user/business ownership constraints.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
