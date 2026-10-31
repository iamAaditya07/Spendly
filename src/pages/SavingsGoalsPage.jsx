import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  fetchSavingsGoals,
  createSavingsGoal,
  addSavingsContribution,
  deleteSavingsGoal,
  calculateSavingsPacing
} from '../services/savingsService';
import { formatCurrency, formatDate } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Target,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
  Laptop,
  Palmtree,
  Smartphone,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  X,
  Trash2,
  DollarSign
} from 'lucide-react';

export default function SavingsGoalsPage() {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [activeGoalForDeposit, setActiveGoalForDeposit] = useState(null);

  // Create Form
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('laptop');

  // Add Money Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await fetchSavingsGoals(user?.id);
      setGoals(data);
    } catch (err) {
      console.error('Error loading savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  // Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount) return;

    try {
      const created = await createSavingsGoal({
        userId: user?.id,
        title,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate,
        category
      });

      await loadGoals();
      setShowCreateModal(false);
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      showToast(`Savings Goal "${title}" created!`);

      if (parseFloat(currentAmount) >= parseFloat(targetAmount)) {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Create goal error:', err);
      showToast('Failed to create goal', 'error');
    }
  };

  // Add Contribution
  const handleDepositMoney = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !activeGoalForDeposit) return;

    try {
      const updated = await addSavingsContribution({
        goalId: activeGoalForDeposit.id,
        userId: user?.id,
        amount,
        notes: depositNotes
      });

      await loadGoals();
      setShowAddMoneyModal(false);
      setDepositAmount('');
      setDepositNotes('');
      showToast(`Added ₹${amount.toLocaleString('en-IN')} to "${activeGoalForDeposit.title}"!`);

      // Check if newly completed!
      if (updated && updated.is_completed) {
        triggerConfetti();
        showToast(`🎉 CONGRATULATIONS! You crushed your "${activeGoalForDeposit.title}" goal!`);
      }
    } catch (err) {
      console.error('Deposit error:', err);
      showToast('Failed to record contribution', 'error');
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id, goalTitle) => {
    if (!window.confirm(`Delete savings goal "${goalTitle}"?`)) return;
    try {
      await deleteSavingsGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      showToast('Goal deleted');
    } catch (err) {
      console.error('Delete goal error:', err);
      showToast('Failed to delete goal', 'error');
    }
  };

  // Calculate total saved across all goals
  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 3: Savings Goals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Savings Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Save systematically for laptops, semester trips, certifications, or emergency funds.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Savings Progress Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Accumulated Savings
          </span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalSaved)}
            <span className="text-sm font-normal text-slate-400"> of {formatCurrency(totalTarget)} target</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active across {goals.length} target goals
          </p>
        </div>

        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-brand-600 dark:text-brand-400">Overall Progress</span>
            <span className="text-slate-700 dark:text-slate-300">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const pacing = calculateSavingsPacing(goal);

          return (
            <div
              key={goal.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                pacing.isCompleted
                  ? 'border-emerald-300 dark:border-emerald-800 shadow-md shadow-emerald-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                      pacing.isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-violet-100 dark:bg-violet-950 text-violet-600'
                    }`}
                  >
                    {goal.category === 'laptop' ? <Laptop className="w-5 h-5" /> :
                     goal.category === 'trip' ? <Palmtree className="w-5 h-5" /> :
                     goal.category === 'phone' ? <Smartphone className="w-5 h-5" /> :
                     goal.category === 'books' ? <BookOpen className="w-5 h-5" /> :
                     <Target className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {goal.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Target Date: {goal.target_date ? formatDate(goal.target_date) : 'Open-ended'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal.id, goal.title)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar & Amount */}
              <div className="space-y-2 mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(goal.current_amount || 0)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    of {formatCurrency(goal.target_amount)}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pacing.isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-violet-600 to-brand-500'
                    }`}
                    style={{ width: `${pacing.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{pacing.percent}% completed</span>
                  <span>{formatCurrency(pacing.remaining)} left</span>
                </div>
              </div>

              {/* Recommended Monthly Savings & Milestone Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs mb-4">
                {pacing.isCompleted ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Goal Completed! Ready to purchase.</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Recommended Monthly
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {formatCurrency(pacing.recommendedMonthly)}/mo
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Timeline
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {pacing.daysLeft} days remaining
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveGoalForDeposit(goal);
                    setDepositAmount('1000');
                    setShowAddMoneyModal(true);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Money</span>
                </button>

                {pacing.isCompleted && (
                  <button
                    onClick={triggerConfetti}
                    className="py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-all"
                  >
                    🎉 Celebrate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Savings Goal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create New Savings Goal
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MacBook M3, Smartphone, Goa Trip, Books"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="25000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Already Saved (₹)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="laptop">💻 Laptop / Tech</option>
                    <option value="phone">📱 Smartphone</option>
                    <option value="trip">🏖️ College Trip / Vacation</option>
                    <option value="books">📚 Books & Courses</option>
                    <option value="emergency">🛡️ Emergency Fund</option>
                    <option value="general">🎯 General Goal</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Money / Contribution */}
      {showAddMoneyModal && activeGoalForDeposit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add Money to "{activeGoalForDeposit.title}"
              </h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="500"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-extrabold outline-none focus:border-brand-500"
                />
              </div>

              {/* Quick Deposit Pills */}
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val.toString())}
                    className="px-3 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Source / Note (Optional)
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g. Saved from pocket money, Diwali bonus, Stipend"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
