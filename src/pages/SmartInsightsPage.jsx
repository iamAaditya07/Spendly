import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { fetchTransactions } from '../services/transactionsService';
import { generateSpendingInsights, getAIPromptContext } from '../services/insightsService';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Calendar,
  Zap,
  Lightbulb,
  CheckCircle2,
  Code2,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export default function SmartInsightsPage() {
  const { user, profile } = useAuth();
  const { setCurrentPage } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIPayload, setShowAIPayload] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const txs = await fetchTransactions(user.id);
        setTransactions(txs);
      } catch (err) {
        console.error('Error in insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const insights = generateSpendingInsights(transactions, profile?.monthly_pocket_money || 8000);
  const aiContext = getAIPromptContext(insights, profile);

  // Weekend vs Weekday chart data
  const weekendWeekdayData = [
    { name: 'Weekdays (Mon-Fri)', amount: insights.weekdayTotal, fill: '#6366f1' },
    { name: 'Weekends (Sat-Sun)', amount: insights.weekendTotal, fill: '#ec4899' }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 6: Smart Spending Insights</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Spending Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Rule-based analytics analyzing canteen spikes, weekend surges, and actionable savings advice.
          </p>
        </div>

        <button
          onClick={() => setShowAIPayload(!showAIPayload)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
        >
          <Brain className="w-4 h-4 text-cyan-500" />
          <span>{showAIPayload ? 'Hide AI Architecture' : 'View AI-Ready Schema'}</span>
        </button>
      </div>

      {/* AI Integration Ready Architecture Card (Expandable) */}
      {showAIPayload && (
        <div className="p-6 rounded-3xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-extrabold text-white">
                Structured Prompt Context for Future LLM / Gemini Integration
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              AI-Ready JSON
            </span>
          </div>
          <p className="text-xs text-slate-400">
            This structured context object is generated dynamically and ready to be dispatched to any LLM API for personalized advice:
          </p>
          <pre className="p-4 rounded-2xl bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto border border-slate-800">
            {JSON.stringify(aiContext, null, 2)}
          </pre>
        </div>
      )}

      {/* Month on Month & Top Category Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Month-on-Month Pace */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Month-on-Month Trend
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(insights.currentTotal)}
            </span>
            <span
              className={`text-xs font-bold inline-flex items-center ${
                insights.momChangeAmount <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {insights.momChangeAmount <= 0 ? (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{Math.abs(insights.momChangePercent)}% less than prev mo</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{insights.momChangePercent}% vs prev mo</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Previous month total: {formatCurrency(insights.prevTotal)}
          </p>
        </div>

        {/* Top Spending Category */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Top Spending Pillar
          </span>
          <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1 truncate">
            {insights.topCategories[0]?.name || 'None'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {insights.topCategories[0]
              ? `${formatCurrency(insights.topCategories[0].total)} (${insights.topCategories[0].percentage}% of budget)`
              : 'Log expenses to see category leadership'}
          </p>
        </div>

        {/* Weekend Spending Ratio */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Weekend Outing Share
          </span>
          <p className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 mt-1">
            {insights.weekendPercentage}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {insights.isWeekendSpike ? '⚠️ High weekend bias detected' : 'Balanced weekday/weekend pacing'}
          </p>
        </div>
      </div>

      {/* Surges & Abnormal Spikes Alert Card */}
      {insights.surges.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-sm">
            <Zap className="w-4 h-4 text-rose-600" />
            <span>Unusual Spending Surges Detected!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {insights.surges.map(s => (
              <div key={s.category} className="p-3 rounded-2xl bg-white/60 dark:bg-rose-900/30 border border-rose-200/60 text-xs">
                <strong>{s.category}</strong> surged by <span className="font-extrabold text-rose-600 dark:text-rose-400">+{s.increasePercent}%</span> compared to last month ({formatCurrency(s.prevTotal)} ➔ {formatCurrency(s.currentTotal)}).
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekend vs Weekday Spending Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Weekday vs Weekend Spending
              </h3>
              <p className="text-xs text-slate-400">Campus study days vs weekend social hangouts</p>
            </div>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekendWeekdayData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {weekendWeekdayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Category Ratios */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Highest Expense Categories
              </h3>
              <p className="text-xs text-slate-400">Categories consuming the bulk of your pocket money</p>
            </div>
            <PieIcon className="w-5 h-5 text-brand-600" />
          </div>

          <div className="space-y-3 pt-1">
            {insights.topCategories.slice(0, 4).map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(cat.total)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Student Savings Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Actionable Student Savings Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.suggestions.map(tip => (
            <div
              key={tip.id}
              className={`p-5 rounded-3xl border space-y-2 transition-all ${
                tip.type === 'critical'
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                  : tip.type === 'caution'
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-xs">
                  {tip.type.toUpperCase()}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  Save ~₹{tip.potentialSavings}
                </span>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {tip.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
