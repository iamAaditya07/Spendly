import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  calculateFinancialHealthScore,
  getHealthScoreHistory
} from '../services/healthScoreService';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Award,
  Wallet,
  Target,
  Flame,
  CalendarClock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function FinancialHealthPage() {
  const { user } = useAuth();
  const { setCurrentPage } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadHealthScore();
    }
  }, [user?.id]);

  const loadHealthScore = async () => {
    try {
      setLoading(true);
      const [scoreRes, historyRes] = await Promise.all([
        calculateFinancialHealthScore(user?.id),
        getHealthScoreHistory(user?.id)
      ]);
      setScoreData(scoreRes);
      setHistoryData(historyRes);
    } catch (e) {
      console.error('Error calculating health score:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const scoreRes = await calculateFinancialHealthScore(user?.id);
      const historyRes = await getHealthScoreHistory(user?.id);
      setScoreData(scoreRes);
      setHistoryData(historyRes);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !scoreData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Evaluating your financial health diagnostic...
        </p>
      </div>
    );
  }

  const {
    overallScore = 75,
    grade = 'A',
    tier = 'Healthy',
    badgeColor = '#6366f1',
    pillars = [],
    recommendations = []
  } = scoreData || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Financial Health Score
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A comprehensive, transparent diagnostic of your college budgeting habits, savings resilience, and spending stability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-brand-500" />
            Scoring Formula
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        </div>
      </div>

      {/* Transparent Formula & Methodology Banner */}
      {showFormulaModal && (
        <div className="p-6 rounded-2xl bg-indigo-50/80 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Transparent Scoring Methodology (0 to 100)
            </h3>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-indigo-900/80 dark:text-indigo-300 leading-relaxed">
            Your Financial Health Score is evaluated purely from your authenticated financial data across 5 equal pillars (20 points each). We believe in complete transparency with zero black-box algorithms.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">1. Budget Adherence (20 pts)</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Pacing against monthly pocket money limit. Max points awarded for spending &lt; 70% of allowance.
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">2. Savings Habits (20 pts)</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Active savings goal contributions and consistency of saving 10%–20% of monthly income.
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400">3. Spending Consistency (20 pts)</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Coefficient of variation: Measures whether spending is evenly distributed vs. erratic weekend spikes.
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-cyan-600 dark:text-cyan-400">4. Safety Buffer (20 pts)</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Available uncommitted liquidity to absorb unexpected campus expenses (books, health, transit).
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-pink-600 dark:text-pink-400">5. Subscriptions Drag (20 pts)</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Ratio of recurring digital subscriptions (OTT, cloud, music) relative to total income (&lt; 8% is ideal).
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> The Spendly Financial Health Score is an educational budgeting metric created for student personal finance. It is <strong>NOT</strong> a credit bureau score (e.g., CIBIL, Experian, FICO) and does not guarantee financial stability or loan eligibility.
            </span>
          </div>
        </div>
      )}

      {/* Main Score Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Radial / Big Score Card (5 cols) */}
        <div className="lg:col-span-5 p-7 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Subtle background glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Student Wellness Index
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 backdrop-blur-md border border-white/20 text-white">
                Grade {grade}
              </span>
            </div>

            <div className="my-8 text-center">
              <div className="inline-flex items-baseline justify-center">
                <span className="text-7xl font-black tracking-tight text-white drop-shadow-md">
                  {overallScore}
                </span>
                <span className="text-2xl font-bold text-indigo-300 ml-1">/100</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: badgeColor }}
                />
                <span className="text-sm font-bold text-slate-200">
                  {tier} Financial Health
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {overallScore >= 80
                ? 'Outstanding discipline! Your low recurring overhead and steady savings rate keep you financially resilient.'
                : overallScore >= 65
                ? 'Solid money habits! A minor adjustment to weekend dining out and daily limits will elevate you to Grade A+.'
                : 'Your budget is running tight this month. Implementing a daily safe spending cap will help balance your cashflow.'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-indigo-300/80 pt-1 border-t border-white/10">
              <span>Recalculated live from transactions</span>
              <span className="font-semibold text-white">5 Pillars Audited</span>
            </div>
          </div>
        </div>

        {/* Right: Score Trend Over Time (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Score Progression Over Time
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                6-Month Trajectory
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Watch your financial discipline improve as you hit savings goals and avoid impulse spikes.
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  domain={[30, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-lg border border-slate-800">
                          <p className="font-bold">{d.month} Health Snapshot</p>
                          <p className="text-brand-300 font-extrabold mt-0.5">
                            Score: {d.overall_score} / 100 ({d.tier || 'Healthy'})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="overall_score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span>Starting Baseline: {historyData[0]?.overall_score || 58} pts</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              +{Math.max(0, overallScore - (historyData[0]?.overall_score || 58))} pts Improvement
            </span>
          </div>
        </div>
      </div>

      {/* Five Individual Pillar Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-600" />
          Diagnostic Pillars Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((pillar) => {
            const pct = Math.round((pillar.score / pillar.max) * 100);
            return (
              <div
                key={pillar.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {pillar.name}
                  </h4>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${pillar.color}15`,
                      color: pillar.color
                    }}
                  >
                    {pillar.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {pillar.score}
                    <span className="text-xs font-semibold text-slate-400">/{pillar.max} pts</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {pct}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pillar.color
                    }}
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Improvement Recommendations */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Personalized Recommendations to Elevate Your Score
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
            Actionable Next Steps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {rec.pillar}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      rec.priority === 'high'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200'
                    }`}
                  >
                    {rec.priority} priority
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <button
                onClick={() => setCurrentPage(rec.page)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 transition-colors flex items-center justify-center gap-1.5"
              >
                {rec.actionLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
