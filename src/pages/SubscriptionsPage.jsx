import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  fetchSubscriptions,
  createSubscription,
  togglePauseSubscription,
  deleteSubscription,
  calculateSubscriptionMetrics
} from '../services/subscriptionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  CalendarClock,
  PlusCircle,
  Sparkles,
  AlertCircle,
  Tv,
  Dumbbell,
  Code,
  ShoppingBag,
  Pause,
  Play,
  Trash2,
  X,
  CreditCard,
  CheckCircle2,
  Bell
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly'); // 'monthly' | 'weekly' | 'yearly'
  const [nextPaymentDate, setNextPaymentDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState('entertainment');

  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptions(user?.id);
      setSubscriptions(data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = calculateSubscriptionMetrics(subscriptions);

  // Handle Add
  const handleAddSubscription = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || !nextPaymentDate) return;

    try {
      await createSubscription({
        userId: user?.id,
        name,
        amount,
        billingFrequency: frequency,
        nextPaymentDate,
        category
      });

      await loadSubscriptions();
      setShowAddModal(false);
      setName('');
      setAmount('');
      showToast(`Added subscription: ${name}`);
    } catch (err) {
      console.error('Add subscription error:', err);
      showToast('Failed to add subscription', 'error');
    }
  };

  // Toggle Pause
  const handleTogglePause = async (sub) => {
    try {
      await togglePauseSubscription(sub.id, sub.is_paused);
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, is_paused: !s.is_paused } : s));
      showToast(sub.is_paused ? `Resumed ${sub.name}` : `Paused ${sub.name}`);
    } catch (err) {
      console.error('Pause error:', err);
      showToast('Failed to update subscription status', 'error');
    }
  };

  // Delete
  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Delete subscription "${subName}"?`)) return;
    try {
      await deleteSubscription(id);
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      showToast('Subscription deleted');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete subscription', 'error');
    }
  };

  // Days until payment calculation
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 4: Subscription Tracker</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Recurring Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor OTT plans, Spotify, Gym, and coding platforms. Never get hit by unexpected auto-debits.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Renewal Alert Banner if renewals are coming up within 7 days */}
      {metrics.renewalsWithin7Days > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-4 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce" />
            <div>
              <p className="text-xs sm:text-sm font-extrabold">
                {metrics.renewalsWithin7Days} subscription{metrics.renewalsWithin7Days > 1 ? 's are' : ' is'} renewing within the next 7 days!
              </p>
              <p className="text-xs opacity-90">
                Check upcoming payment dates below to pause any unwanted student plans.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Monthly Spend
          </span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(metrics.monthlyTotal)}
            <span className="text-xs font-medium text-slate-400">/mo</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Normalized across weekly, monthly & yearly plans
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Subscriptions
          </span>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.activeCount}
            <span className="text-xs font-medium text-slate-400"> of {metrics.totalCount} plans</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Currently active recurring services
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Renewals
          </span>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {metrics.renewalsWithin7Days}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Due in the next 7 calendar days
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map(sub => {
          const daysUntil = getDaysUntil(sub.next_payment_date);
          const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

          return (
            <div
              key={sub.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                sub.is_paused
                  ? 'opacity-60 border-slate-200 dark:border-slate-800'
                  : isUrgent
                  ? 'border-amber-300 dark:border-amber-800 shadow-sm'
                  : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                      sub.category === 'fitness' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950' :
                      sub.category === 'coding' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950' :
                      sub.category === 'shopping' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-950'
                    }`}
                  >
                    {sub.category === 'fitness' ? <Dumbbell className="w-5 h-5" /> :
                     sub.category === 'coding' ? <Code className="w-5 h-5" /> :
                     sub.category === 'shopping' ? <ShoppingBag className="w-5 h-5" /> :
                     <Tv className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {sub.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {sub.billing_frequency}
                      </span>
                      {sub.is_paused && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(sub.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block capitalize">
                    /{sub.billing_frequency === 'weekly' ? 'wk' : sub.billing_frequency === 'yearly' ? 'yr' : 'mo'}
                  </span>
                </div>
              </div>

              {/* Renewal Date Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <CalendarClock className="w-4 h-4 text-slate-400" />
                  <span>Next Renewal: <strong>{formatDate(sub.next_payment_date)}</strong></span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  {daysUntil !== null ? (daysUntil <= 0 ? 'Due Today' : `In ${daysUntil} days`) : ''}
                </span>
              </div>

              {/* Action Buttons: Pause/Resume + Delete */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleTogglePause(sub)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sub.is_paused
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sub.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{sub.is_paused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={() => handleDelete(sub.id, sub.name)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                  title="Delete subscription"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Subscription */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add Recurring Subscription
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spotify Student, Netflix, Gym, Claude Pro"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="199"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Next Payment Date
                  </label>
                  <input
                    type="date"
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
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
                    <option value="entertainment">🎬 OTT / Entertainment</option>
                    <option value="fitness">💪 Gym / Fitness</option>
                    <option value="coding">💻 Coding / Cloud Tools</option>
                    <option value="shopping">🛍️ Shopping / Delivery</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
