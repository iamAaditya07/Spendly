import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  evaluateAndGenerateReminders,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences
} from '../services/reminderService';
import { formatDate } from '../utils/formatters';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Tv,
  Target,
  Settings,
  Trash2,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Filter,
  Sparkles,
  Clock,
  X
} from 'lucide-react';

const TYPE_ICONS = {
  subscription: Tv,
  budget_warning: AlertTriangle,
  budget_exceeded: AlertCircle,
  savings_goal: Target,
  system: Bell
};

const PRIORITY_BADGES = {
  critical: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  medium: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
};

export default function RemindersPage() {
  const { user } = useAuth();
  const { setCurrentPage } = useApp();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'subscription', 'budget'

  // Preferences state
  const [prefs, setPrefs] = useState({
    subscription_reminders: true,
    budget_alerts: true,
    savings_goal_reminders: true,
    daily_digest: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSavedMessage, setPrefsSavedMessage] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifs, p] = await Promise.all([
        evaluateAndGenerateReminders(user?.id),
        fetchNotificationPreferences(user?.id)
      ]);
      setNotifications(notifs);
      setPrefs(p);
    } catch (e) {
      console.error('Error loading reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncReminders = async () => {
    setEvaluating(true);
    try {
      const refreshed = await evaluateAndGenerateReminders(user?.id);
      setNotifications(refreshed);
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(user?.id, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(user?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDismiss = async (id) => {
    await dismissNotification(user?.id, id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(user?.id, prefs);
      setPrefsSavedMessage(true);
      setTimeout(() => setPrefsSavedMessage(false), 3000);
      handleSyncReminders();
    } catch (e) {
      console.error('Error saving preferences:', e);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'subscription') return n.type === 'subscription';
    if (activeTab === 'budget') return n.type === 'budget_warning' || n.type === 'budget_exceeded';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Bell className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Smart Reminders
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                  {unreadCount} New
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Automated alerts for subscription due dates, budget limit thresholds, and savings goal milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 transition-all shadow-sm"
          >
            Mark all read
          </button>
          <button
            onClick={handleSyncReminders}
            disabled={evaluating}
            className="px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            Evaluate Alerts
          </button>
        </div>
      </div>

      {/* Main Grid: Feed vs Configuration Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Notification Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'unread'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'subscription'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'budget'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Budget Warnings
            </button>
          </div>

          {/* List of Notification Cards */}
          {loading ? (
            <div className="py-20 text-center space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <RefreshCw className="w-7 h-7 text-brand-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Checking scheduled reminders...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-20 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                You are all caught up!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No active notifications right now. Spendly automatically monitors your budgets and subscription dates in the background.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const IconComponent = TYPE_ICONS[notif.type] || Bell;
                const priorityClass = PRIORITY_BADGES[notif.priority] || PRIORITY_BADGES.medium;

                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 relative group ${
                      !notif.is_read
                        ? 'bg-white dark:bg-slate-900 border-brand-200 dark:border-brand-900/80 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.is_read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-600 animate-ping" />
                    )}

                    {/* Notification Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        notif.type === 'budget_exceeded'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                          : notif.type === 'subscription'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                          : notif.type === 'savings_goal'
                          ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/80 dark:text-violet-400'
                          : 'bg-brand-100 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityClass}`}
                        >
                          {notif.priority}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {notif.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(notif.created_at)}
                        </span>

                        <div className="flex items-center gap-2">
                          {notif.action_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPage(notif.action_url);
                              }}
                              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
                            >
                              <span>Take Action</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notif.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Dismiss notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Configuration Preferences Panel (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reminder Preferences
            </h3>
          </div>

          {prefsSavedMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Preferences saved successfully!
            </div>
          )}

          <div className="space-y-4">
            {/* Toggle 1: Subscription Reminders */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Subscription Payments
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Alert 7 days and on the day recurring OTT/tools renew.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.subscription_reminders}
                onChange={() => handleTogglePref('subscription_reminders')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Budget Alerts */}
            <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Pocket Money Limit Alerts
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Warn at 80% threshold and trigger alert on 100% budget overrun.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.budget_alerts}
                onChange={() => handleTogglePref('budget_alerts')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 3: Savings Goals */}
            <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Savings Goal Milestones
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Celebrate 50% and 100% completion milestones.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.savings_goal_reminders}
                onChange={() => handleTogglePref('savings_goal_reminders')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 4: Daily Digest */}
            <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Daily Spending Digest
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Show remaining daily allowance reminders.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.daily_digest}
                onChange={() => handleTogglePref('daily_digest')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
          >
            {savingPrefs ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Preferences</>
            )}
          </button>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              Smart Deduplication Active
            </span>
            <p>
              Spendly hashes notification references to ensure you are never spammed with repeated alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
