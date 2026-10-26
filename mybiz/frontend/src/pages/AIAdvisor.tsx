import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { AIRecommendation } from '../types';
import { Card, Badge } from '../components/UI';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  intent?: string;
  decision_rubric?: {
    verdict?: string;
    status_code?: string;
    requested_amount?: number;
    available_personal_cash?: number;
    upcoming_commitments?: number;
    savings_reserve?: number;
    safety_buffer?: number;
    safe_personal_spending?: number;
    business_profit?: number;
    tax_reserve_set_aside?: number;
  };
  evidence?: any;
}

export const AIAdvisorPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello Alex! I am your MyBIZ Financial and Business Advisor for Apex Digital Studio. All my recommendations and calculations are grounded directly in your verified database numbers. How can I help you make a sound financial decision today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  const quickQuestions = [
    'Can I safely spend $2,000 this month?',
    'Can I spend $1,500 on a new laptop?',
    'How is Apex Digital Studio performing?',
    'Where am I spending the most personal money?',
    'What is my monthly budget pacing?'
  ];

  const loadRecommendations = async () => {
    try {
      const res = await api.getAIRecommendations(activeBusiness?.id);
      setRecommendations(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [activeBusiness]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAdvisor(q, activeBusiness?.id);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          source: res.source,
          intent: res.intent,
          decision_rubric: res.decision_rubric,
          evidence: res.evidence
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an error evaluating your financial context: ' + err.message
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles size={13} />
          <span>Grounded Financial Intelligence • Zero Guesswork</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI Financial & Business Advisor</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask questions answered directly from your verified ledger: safe-to-spend calculations, affordability checks, and business profitability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[700px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">MyBIZ Grounded Copilot</h4>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authoritative DB Calculus Active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Grounded Against Hallucinations</span>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Founder Queries:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="shrink-0 px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div key={idx} className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs ${
                      isAssistant ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    {isAssistant ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    {/* Assistant Metadata */}
                    {isAssistant && m.intent && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                          INTENT: {m.intent}
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                    {/* Affordability Decision Rubric Card */}
                    {isAssistant && m.decision_rubric && (
                      <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Scale size={13} className="text-indigo-600" />
                            Decision Matrix
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.decision_rubric.verdict === 'AFFORDABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.decision_rubric.verdict === 'CAUTION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {m.decision_rubric.verdict}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            Available Cash: <strong className="text-slate-800">${m.decision_rubric.available_personal_cash?.toLocaleString()}</strong>
                          </div>
                          <div>
                            Upcoming Commitments: <strong className="text-slate-800">${m.decision_rubric.upcoming_commitments?.toLocaleString()}</strong>
                          </div>
                          <div>
                            Savings Reserve: <strong className="text-slate-800">${m.decision_rubric.savings_reserve?.toLocaleString()}</strong>
                          </div>
                          <div>
                            Safety Buffer: <strong className="text-slate-800">${m.decision_rubric.safety_buffer?.toLocaleString()}</strong>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            Safe Spending Limit: <strong className="text-emerald-600">${m.decision_rubric.safe_personal_spending?.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {m.source && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-mono uppercase">
                          <Database size={11} className="text-slate-400" />
                          Source: {m.source}
                        </span>
                        <span className="text-[9px] text-slate-400 italic">Estimate only — not official advice</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Calculating verified ledger balances & evaluating safe spending thresholds...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask e.g. 'Can I safely spend $2,000 this month?'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Ask Advisor</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Strategic AI Recommendations Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audited Recommendations
            </h3>
            <button
              onClick={loadRecommendations}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {recommendations.length === 0 ? (
            <Card>
              <p className="text-xs text-slate-400 text-center py-6">
                Record personal or business transactions to trigger strategic recommendations.
              </p>
            </Card>
          ) : (
            recommendations.map((rec) => {
              const badgeVariant =
                rec.priority === 'high'
                  ? 'danger'
                  : rec.priority === 'medium'
                  ? 'warning'
                  : 'success';

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2 hover:border-indigo-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {rec.category}
                    </span>
                    <Badge variant={badgeVariant}>{rec.priority.toUpperCase()}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{rec.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                  
                  {/* Verified Metric Evidence Field */}
                  {rec.evidence && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-600 font-mono">
                      <span className="font-bold text-indigo-700 block mb-0.5">DB Evidence:</span>
                      {rec.evidence}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-50 text-[11px] font-medium text-indigo-700 flex items-start gap-1">
                    <ArrowRight size={13} className="shrink-0 mt-0.5" />
                    <span>{rec.impact}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
