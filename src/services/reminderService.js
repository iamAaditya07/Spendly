import { supabase } from '../lib/supabase';
import { fetchTransactions } from './transactionsService';
import { fetchSubscriptions } from './subscriptionService';
import { fetchSavingsGoals } from './savingsService';
import { getProfile } from './profileService';
import { formatCurrency, formatDate } from '../utils/formatters';

const DEMO_NOTIF_KEY = 'spendly_demo_notifications';
const DEMO_PREFS_KEY = 'spendly_demo_notif_prefs';

function getLocalDemoNotifications() {
  const data = localStorage.getItem(DEMO_NOTIF_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }

  // Pre-seed realistic initial student reminders
  const seeded = [
    {
      id: 'notif_demo_1',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Upcoming Subscription: Netflix Standard',
      message: 'Your monthly renewal of ₹649 is scheduled in 3 days. Make sure you have enough UPI balance.',
      type: 'subscription',
      priority: 'high',
      is_read: false,
      is_dismissed: false,
      reference_id: 'sub_demo_1_upcoming',
      action_url: 'subscriptions',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'notif_demo_2',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Budget Alert: 76% Allowance Consumed',
      message: 'You have spent ₹6,080 of your ₹8,000 monthly pocket money. Your daily safe limit is ₹137/day.',
      type: 'budget_warning',
      priority: 'medium',
      is_read: false,
      is_dismissed: false,
      reference_id: 'budget_warn_demo_initial',
      action_url: 'pocket-planner',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: 'notif_demo_3',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Savings Goal Progress: Coding Laptop',
      message: 'You are at 72% towards your ₹45,000 laptop goal! A small deposit of ₹1,000 will keep you on target.',
      type: 'savings_goal',
      priority: 'low',
      is_read: true,
      is_dismissed: false,
      reference_id: 'goal_demo_laptop_reminder',
      action_url: 'goals',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  localStorage.setItem(DEMO_NOTIF_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalDemoNotifications(notifs) {
  localStorage.setItem(DEMO_NOTIF_KEY, JSON.stringify(notifs));
}

function getLocalDemoPrefs() {
  const data = localStorage.getItem(DEMO_PREFS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }
  return {
    subscription_reminders: true,
    budget_alerts: true,
    savings_goal_reminders: true,
    daily_digest: true
  };
}

function saveLocalDemoPrefs(prefs) {
  localStorage.setItem(DEMO_PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Evaluates real-time financial data and generates automated, deduplicated notifications
 */
export async function evaluateAndGenerateReminders(userId) {
  if (!userId) return [];

  const [prefs, profile, transactions, subscriptions, goals] = await Promise.all([
    fetchNotificationPreferences(userId),
    getProfile(userId).catch(() => ({ monthly_pocket_money: 8000 })),
    fetchTransactions(userId).catch(() => []),
    fetchSubscriptions(userId).catch(() => []),
    fetchSavingsGoals(userId).catch(() => [])
  ]);

  const existingNotifs = await fetchNotifications(userId, false);
  const existingRefs = new Set(existingNotifs.map((n) => n.reference_id).filter(Boolean));

  const newReminders = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const pad = (n) => String(n).padStart(2, '0');
  const monthKey = `${currentYear}-${pad(currentMonth + 1)}`;

  // 1. Subscription Renewals (within 7 days)
  if (prefs.subscription_reminders) {
    const activeSubs = subscriptions.filter((s) => !s.is_paused);
    for (const sub of activeSubs) {
      if (!sub.next_payment_date) continue;
      const dueDate = new Date(sub.next_payment_date);
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        const refId = `sub_${sub.id}_${sub.next_payment_date}`;
        if (!existingRefs.has(refId)) {
          newReminders.push({
            user_id: userId,
            title: `Upcoming Payment: ${sub.name}`,
            message: diffDays === 0
              ? `Your ${sub.name} subscription of ${formatCurrency(sub.amount)} is due TODAY.`
              : `Your ${sub.name} renewal of ${formatCurrency(sub.amount)} is scheduled in ${diffDays} day${diffDays > 1 ? 's' : ''} (${formatDate(sub.next_payment_date)}).`,
            type: 'subscription',
            priority: diffDays <= 2 ? 'high' : 'medium',
            reference_id: refId,
            action_url: 'subscriptions'
          });
        }
      }
    }
  }

  // 2. Budget Alerts (Approaching 80% or Exceeded 100%)
  if (prefs.budget_alerts) {
    const pocketMoney = parseFloat(profile?.monthly_pocket_money || 8000);
    const monthExpenses = transactions
      .filter((t) => {
        if (!t.date || t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const spendPercent = pocketMoney > 0 ? (monthExpenses / pocketMoney) * 100 : 0;

    // Check if exceeded 100%
    if (spendPercent >= 100) {
      const refId = `budget_exceeded_${monthKey}`;
      if (!existingRefs.has(refId)) {
        newReminders.push({
          user_id: userId,
          title: '🚨 Monthly Budget Exceeded',
          message: `You have spent ${formatCurrency(monthExpenses)}, exceeding your ${formatCurrency(pocketMoney)} budget by ${formatCurrency(monthExpenses - pocketMoney)}. Avoid non-essential expenses for the rest of the month!`,
          type: 'budget_exceeded',
          priority: 'critical',
          reference_id: refId,
          action_url: 'pocket-planner'
        });
      }
    }
    // Check if approaching 80%
    else if (spendPercent >= 80) {
      const refId = `budget_warning_80_${monthKey}`;
      if (!existingRefs.has(refId)) {
        newReminders.push({
          user_id: userId,
          title: '⚠️ Approaching Pocket Money Limit',
          message: `You have consumed ${Math.round(spendPercent)}% (${formatCurrency(monthExpenses)}) of your monthly pocket money. Only ${formatCurrency(pocketMoney - monthExpenses)} remains.`,
          type: 'budget_warning',
          priority: 'high',
          reference_id: refId,
          action_url: 'pocket-planner'
        });
      }
    }
  }

  // 3. Savings Goal Milestones
  if (prefs.savings_goal_reminders) {
    for (const goal of goals) {
      if (goal.is_completed) continue;
      const target = parseFloat(goal.target_amount || 0);
      const current = parseFloat(goal.current_amount || 0);
      if (target <= 0) continue;
      const pct = (current / target) * 100;

      // Halfway milestone reminder
      if (pct >= 50 && pct < 60) {
        const refId = `goal_50_${goal.id}`;
        if (!existingRefs.has(refId)) {
          newReminders.push({
            user_id: userId,
            title: `🎯 Goal Halfway: ${goal.title}`,
            message: `You have achieved 50% of your target for ${goal.title} (${formatCurrency(current)} of ${formatCurrency(target)}). Keep it up!`,
            type: 'savings_goal',
            priority: 'medium',
            reference_id: refId,
            action_url: 'goals'
          });
        }
      }
    }
  }

  // Insert generated reminders
  if (newReminders.length > 0) {
    if (userId.startsWith('00000000')) {
      const local = getLocalDemoNotifications();
      newReminders.forEach((r) => {
        local.unshift({
          ...r,
          id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 4),
          is_read: false,
          is_dismissed: false,
          created_at: new Date().toISOString()
        });
      });
      saveLocalDemoNotifications(local);
    } else {
      try {
        await supabase.from('notifications').insert(newReminders);
      } catch (err) {
        console.warn('Could not insert automated reminders to Supabase:', err.message);
      }
    }
  }

  return fetchNotifications(userId, false);
}

/**
 * Fetch all notifications (optionally including dismissed ones)
 */
export async function fetchNotifications(userId, includeDismissed = false) {
  if (!userId) return [];

  if (userId.startsWith('00000000')) {
    const local = getLocalDemoNotifications();
    return includeDismissed ? local : local.filter((n) => !n.is_dismissed);
  }

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeDismissed) {
      query = query.eq('is_dismissed', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase notifications fetch note, using local session:', err.message);
    const local = getLocalDemoNotifications();
    return includeDismissed ? local : local.filter((n) => !n.is_dismissed);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  if (userId.startsWith('00000000')) {
    const local = getLocalDemoNotifications();
    const item = local.find((n) => n.id === notificationId);
    if (item) {
      item.is_read = true;
      saveLocalDemoNotifications(local);
    }
    return;
  }

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Error marking notification as read:', err.message);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  if (userId.startsWith('00000000')) {
    const local = getLocalDemoNotifications();
    local.forEach((n) => { n.is_read = true; });
    saveLocalDemoNotifications(local);
    return;
  }

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_dismissed', false);
  } catch (err) {
    console.warn('Error marking all notifications as read:', err.message);
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(userId, notificationId) {
  if (userId.startsWith('00000000')) {
    const local = getLocalDemoNotifications();
    const item = local.find((n) => n.id === notificationId);
    if (item) {
      item.is_dismissed = true;
      saveLocalDemoNotifications(local);
    }
    return;
  }

  try {
    await supabase
      .from('notifications')
      .update({ is_dismissed: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Error dismissing notification:', err.message);
  }
}

/**
 * Fetch user notification preferences
 */
export async function fetchNotificationPreferences(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalDemoPrefs();
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return getLocalDemoPrefs();
    }
    return data;
  } catch (err) {
    return getLocalDemoPrefs();
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(userId, prefs) {
  if (userId.startsWith('00000000')) {
    saveLocalDemoPrefs(prefs);
    return prefs;
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Error updating notification preferences:', err.message);
    saveLocalDemoPrefs(prefs);
    return prefs;
  }
}
