import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { fetchTransactions } from '../services/transactionsService';
import { updateProfile } from '../services/profileService';
import { calculatePocketPlan, simulatePurchase } from '../services/pocketPlannerService';
import { formatCurrency, formatCompactCurrency, getRemainingDaysInMonth } from '../utils/formatters';
import {
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Sliders,
  DollarSign,
  Coffee,
  HelpCircle,
  Edit3
} from 'lucide-react';

export default function PocketPlannerPage() {
  const { user, profile, fetchUserProfile } = useAuth();
  const { showToast, setCurrentPage } = useApp();

  const [pocketMoneyInput, setPocketMoneyInput] = useState('8000');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Simulator state
  const [simPurchase, setSimPurchase] = useState('500');

  // Load transactions and pocket money
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const txs = await fetchTransactions(user.id);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Sum current month's expenses
        const monthExpenses = txs
          .filter(t => {
            if (!t.date || t.type !== 'expense') return false;
            const [y, m] = t.date.split('-').map(Number);
            return y === currentYear && (m - 1) === currentMonth;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        setTotalSpent(monthExpenses);
        setPocketMoneyInput((profile?.monthly_pocket_money || 8000).toString());
      } catch (err) {
        console.error('Error in pocket planner:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, profile]);

  const pocketMoney = parseFloat(pocketMoneyInput) || 8000;
  const plan = calculatePocketPlan({ pocketMoney, totalSpent });

  // Handle saving new baseline pocket money
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateProfile(user.id, {
        monthlyPocketMoney: parseFloat(pocketMoneyInput) || 8000
      });
      await fetchUserProfile(user.id);
      setIsEditingBudget(false);
      showToast('Pocket money target updated successfully!');
    } catch (err) {
      console.error('Budget update error:', err);
      showToast('Failed to update pocket money target', 'error');
    }
  };

  // Simulator calculation
  const sim = simulatePurchase({
    currentRemaining: plan.remaining,
    remainingDays: plan.remainingDays,
    purchaseAmount: parseFloat(simPurchase) || 0
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 1: Smart Pocket Money Planner</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pocket Money & Daily Safe Limit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dynamically calculate your daily spending allowance so your money lasts comfortably till month-end.
          </p>
        </div>

        <button
          onClick={() => setIsEditingBudget(!isEditingBudget)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <Edit3 className="w-4 h-4 text-brand-600" />
          <span>{isEditingBudget ? 'Close Adjuster' : 'Adjust Monthly Allowance'}</span>
        </button>
      </div>

      {/* Pocket Money Adjuster Modal / Inline Form */}
      {isEditingBudget && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500/50 shadow-lg animate-in fade-in duration-200">
          <form onSubmit={handleSaveBudget} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Set Monthly Pocket Money / Allowance (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={pocketMoneyInput}
                  onChange={(e) => setPocketMoneyInput(e.target.value)}
                  step="100"
                  min="500"
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-extrabold outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              Save New Baseline
            </button>
          </form>
        </div>
      )}

      {/* Dynamic Status Alert Banner */}
      <div
        className={`p-5 rounded-3xl border flex items-center justify-between gap-4 transition-all ${
          plan.alertLevel === 'critical'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
            : plan.alertLevel === 'caution'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {plan.alertLevel === 'critical' ? (
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
          ) : plan.alertLevel === 'caution' ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          )}

          <div>
            <h4 className="text-sm font-extrabold">
              {plan.alertLevel === 'critical' ? 'Budget Warning' : plan.alertLevel === 'caution' ? 'Caution Recommended' : 'Pacing Well On Budget'}
            </h4>
            <p className="text-xs opacity-90 mt-0.5 font-medium">
              {plan.alertMessage}
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-xs font-bold uppercase tracking-wider opacity-75">
            Days Left in Month
          </span>
          <p className="text-xl font-extrabold">{plan.remainingDays} Days</p>
        </div>
      </div>

      {/* Four Primary Pocket Money Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Recommended Daily Spending Limit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500 dark:border-brand-500 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Daily Safe Limit
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(plan.dailyAllowance)}
            <span className="text-xs font-medium text-slate-400">/day</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Max safe spend per day till month-end
          </p>
        </div>

        {/* Remaining Pocket Money */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Remaining Money
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(plan.remaining)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {Math.round(100 - plan.percentUsed)}% of allowance available
          </p>
        </div>

        {/* Money Spent */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Spent This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(plan.spent)}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                plan.percentUsed >= 90 ? 'bg-rose-500' :
                plan.percentUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, plan.percentUsed)}%` }}
            />
          </div>
        </div>

        {/* Total Monthly Allowance Target */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Budget
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(plan.budget)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Baseline student pocket money
          </p>
        </div>
      </div>

      {/* What-If Purchase Simulator (Interactive Campus Feature) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-brand-50/40 dark:from-slate-900 dark:to-brand-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              "What-If" Purchase Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simulate how an unplanned campus expense today impacts your daily allowance for the rest of the month.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Controls */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              If I spend ₹{parseFloat(simPurchase) || 0} today on:
            </label>
            <input
              type="range"
              min="100"
              max={Math.min(5000, Math.max(1000, plan.remaining))}
              step="50"
              value={simPurchase}
              onChange={(e) => setSimPurchase(e.target.value)}
              className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {[250, 500, 1000, 1500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSimPurchase(val.toString())}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    simPurchase === val.toString()
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                New Daily Limit
              </span>
              <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                {formatCurrency(sim.newDailyAllowance)}
                <span className="text-xs font-medium text-slate-400">/day</span>
              </p>
              <p className="text-xs text-rose-500 font-semibold mt-1">
                Drops by -{formatCurrency(sim.dailyDrop)}/day
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Remaining Balance
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(sim.afterAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
