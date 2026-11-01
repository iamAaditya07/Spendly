import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { fetchTransactions } from '../services/transactionsService';
import { fetchSavingsGoals } from '../services/savingsService';
import { fetchSubscriptions, calculateSubscriptionMetrics } from '../services/subscriptionService';
import { fetchChallenges, calculateChallengeStats } from '../services/challengeService';
import { generateSpendingInsights } from '../services/insightsService';
import { calculateFinancialHealthScore } from '../services/healthScoreService';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  Users,
  Target,
  CalendarClock,
  Flame,
  Activity,
  Camera,
  Bot,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  School,
  ArrowRight,
  PieChart as PieChartIcon,
  Lightbulb,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatCompactCurrency, getRemainingDaysInMonth, formatDate } from '../utils/formatters';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { setCurrentPage } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all dashboard components
  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [txs, gList, sList, cList, hScore] = await Promise.all([
          fetchTransactions(user.id),
          fetchSavingsGoals(user.id),
          fetchSubscriptions(user.id),
          fetchChallenges(user.id),
          calculateFinancialHealthScore(user.id).catch(() => null)
        ]);
        setTransactions(txs);
        setGoals(gList);
        setSubscriptions(sList);
        setChallenges(cList);
        setHealthScore(hScore);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  // Current month filter
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthTxs = transactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === currentYear && (m - 1) === currentMonth;
  });

  // Calculate financials
  const baselinePocketMoney = profile?.monthly_pocket_money || 8000;
  
  const additionalIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = baselinePocketMoney + additionalIncome;

  const totalExpenses = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = Math.max(0, totalIncome - totalExpenses);
  const remainingDays = getRemainingDaysInMonth();
  const dailyAllowance = Math.round(availableBalance / remainingDays);

  const budgetUsagePercent = totalIncome > 0
    ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
    : 0;

  // Category breakdown for Pie Chart
  const categoryMap = {};
  currentMonthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const name = t.category?.name || 'Other';
      const color = t.category?.color || '#64748b';
      if (!categoryMap[name]) {
        categoryMap[name] = { name, value: 0, color };
      }
      categoryMap[name].value += t.amount;
    });

  const categoryData = Object.values(categoryMap).sort((a, b) => b.value - a.value);

  // Daily spending data for Bar Chart
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap[d] = 0;
  }
  currentMonthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const day = parseInt(t.date.split('-')[2], 10);
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += t.amount;
      }
    });

  const dailyChartData = Object.keys(dailyMap).map(day => ({
    day: `D${day}`,
    amount: dailyMap[day]
  }));

  // Insights, Subscriptions & Challenge Stats
  const insights = generateSpendingInsights(transactions, baselinePocketMoney);
  const subMetrics = calculateSubscriptionMetrics(subscriptions);
  const chalStats = calculateChallengeStats(challenges);

  // Highlight goal
  const primaryGoal = goals[0];
  const goalPercent = primaryGoal
    ? Math.min(100, Math.round(((primaryGoal.current_amount || 0) / primaryGoal.target_amount) * 100))
    : 0;

  // Next subscription due
  const nextSubDue = subscriptions.find(s => !s.is_paused);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-campus-cyan text-white shadow-xl shadow-brand-500/15 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-brand-100 text-xs font-bold uppercase tracking-wider">
            <School className="w-4 h-4" />
            <span>{profile?.college_name || 'Campus Scholar'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'}! 🎓
          </h2>
          <p className="text-sm text-brand-100/90 mt-1">
            Tagline: <span className="font-semibold text-white">Your Money. Your Campus. Your Control.</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('add-transaction')}
            className="px-4 py-2.5 rounded-xl bg-white text-brand-700 font-bold text-xs sm:text-sm hover:bg-brand-50 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense / Income</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Overview Cards (Fintech Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Available Balance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(availableBalance)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{Math.round((availableBalance / totalIncome) * 100)}% budget remains</span>
          </div>
        </div>

        {/* Feature 1: Daily Spending Allowance */}
        <div
          onClick={() => setCurrentPage('pocket-planner')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900 shadow-sm hover:border-brand-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Daily Safe Spending
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              Feature 1
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
            {formatCurrency(dailyAllowance)}
            <span className="text-xs font-medium text-slate-400">/day</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Paced across {remainingDays} remaining days
          </p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpenses)}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budgetUsagePercent >= 90 ? 'bg-rose-500' :
                budgetUsagePercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>
        </div>

        {/* Monthly Pocket Money / Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Budget
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Pocket money baseline + stipend
          </p>
        </div>
      </div>

      {/* Feature 6 Recommendation Banner */}
      {insights.suggestions.length > 0 && (
        <div
          onClick={() => setCurrentPage('insights')}
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-amber-200 dark:border-amber-900 cursor-pointer shadow-xs hover:border-amber-400 transition-all flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Campus Spending Insight:
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Save ~₹{insights.suggestions[0].potentialSavings}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium line-clamp-1">
                {insights.suggestions[0].text}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
            <span>View All Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Category Spending Breakdown
              </h3>
              <p className="text-xs text-slate-400">Where your campus money went this month</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-brand-600" />
          </div>

          {categoryData.length === 0 ? (
            <div className="py-14 text-center">
              <PieChartIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No expenses recorded this month</p>
              <button
                onClick={() => setCurrentPage('add-transaction')}
                className="mt-3 text-xs text-brand-600 font-bold hover:underline"
              >
                + Log your first expense
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
              {/* Legend Badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {categoryData.slice(0, 4).map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}: {formatCompactCurrency(c.value)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spending Trend Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Daily Spending Pattern
              </h3>
              <p className="text-xs text-slate-400">Daily expenses across all days of the month</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>

          {currentMonthTxs.filter(t => t.type === 'expense').length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs font-bold text-slate-500">Daily spending trend will appear here</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row: Savings Goal + Subscriptions + Streak + Health Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Savings Goal Progress */}
        <div
          onClick={() => setCurrentPage('goals')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-violet-500 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Primary Savings Goal
            </span>
            <Target className="w-4 h-4 text-violet-600" />
          </div>

          {primaryGoal ? (
            <>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {primaryGoal.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatCurrency(primaryGoal.current_amount || 0)} of {formatCurrency(primaryGoal.target_amount)}
                </p>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-violet-600 block">{goalPercent}% reached</span>
            </>
          ) : (
            <p className="text-xs text-slate-400">No active savings goal set. Click to create one.</p>
          )}
        </div>

        {/* Subscriptions Widget */}
        <div
          onClick={() => setCurrentPage('subscriptions')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-500 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Subscriptions Total
            </span>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>

          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(subMetrics.monthlyTotal)}
              <span className="text-xs font-medium text-slate-400">/mo</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {subMetrics.activeCount} active recurring plans
            </p>
          </div>

          {nextSubDue && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold truncate">
              Next: {nextSubDue.name} ({formatDate(nextSubDue.next_payment_date)})
            </p>
          )}
        </div>

        {/* No-Spend Streak Widget */}
        <div
          onClick={() => setCurrentPage('challenges')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-rose-500 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              No-Spend Streak
            </span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>

          <div>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              🔥 {chalStats.currentStreak} Days
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Saved ~{formatCurrency(chalStats.totalSaved)} total
            </p>
          </div>

          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
            Click to log today's check-in
          </span>
        </div>

        {/* Financial Health Score Widget */}
        <div
          onClick={() => setCurrentPage('financial-health')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-500 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Financial Health
            </span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>

          <div>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {healthScore?.overallScore || 78}
              <span className="text-xs font-bold text-slate-400">/100</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Grade {healthScore?.grade || 'A'} • {healthScore?.tier || 'Healthy'}
            </p>
          </div>

          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">
            View 5 diagnostic pillars →
          </span>
        </div>
      </div>

      {/* Six Special Feature Quick-Action Tiles */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Special Campus Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setCurrentPage('pocket-planner')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2">
              <Wallet className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Pocket Planner</p>
            <span className="text-[10px] text-slate-400">Daily limit guide</span>
          </button>

          <button
            onClick={() => setCurrentPage('split')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Split with Friends</p>
            <span className="text-[10px] text-slate-400">Roommate settlements</span>
          </button>

          <button
            onClick={() => setCurrentPage('goals')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-violet-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-2">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Savings Goals</p>
            <span className="text-[10px] text-slate-400">Laptop, trips & fests</span>
          </button>

          <button
            onClick={() => setCurrentPage('subscriptions')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-2">
              <CalendarClock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Subscriptions</p>
            <span className="text-[10px] text-slate-400">OTT & renewal alerts</span>
          </button>

          <button
            onClick={() => setCurrentPage('challenges')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-rose-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">No-Spend Streak</p>
            <span className="text-[10px] text-slate-400">Save money challenge</span>
          </button>

          <button
            onClick={() => setCurrentPage('insights')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-cyan-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Smart Insights</p>
            <span className="text-[10px] text-slate-400">Spike & habit analysis</span>
          </button>

          <button
            onClick={() => setCurrentPage('finora-ai')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-slate-900 dark:to-brand-950/30 border border-brand-200 dark:border-brand-900 text-left hover:border-brand-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-brand-900 dark:text-brand-300">Finora AI</p>
            <span className="text-[10px] text-brand-600/80 dark:text-brand-400">Ask campus questions</span>
          </button>

          <button
            onClick={() => setCurrentPage('receipt-scanner')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-brand-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-2">
              <Camera className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Receipt OCR</p>
            <span className="text-[10px] text-slate-400">Scan canteen slips</span>
          </button>

          <button
            onClick={() => setCurrentPage('financial-health')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500 transition-all hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Health Score</p>
            <span className="text-[10px] text-slate-400">0-100 index</span>
          </button>
        </div>
      </div>
    </div>
  );
}
