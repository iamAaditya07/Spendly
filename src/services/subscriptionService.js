import { supabase } from '../lib/supabase';

/**
 * Subscription Tracker Service (Feature 4)
 * Handles recurring campus subscriptions (OTT, Gym, Coursera, Spotify, etc.)
 */

const DEMO_SUBS_KEY = 'spendly_demo_subscriptions';

function getLocalDemoSubscriptions() {
  const saved = localStorage.getItem(DEMO_SUBS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const futureDate = (days) => {
    const d = new Date(Date.now() + days * 86400000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const defaultSubs = [
    {
      id: 'sub_demo_1',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Spotify Student Premium',
      amount: 59,
      billing_frequency: 'monthly',
      next_payment_date: futureDate(3), // In 3 days!
      category: 'entertainment',
      is_paused: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'sub_demo_2',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Campus Gym Membership',
      amount: 800,
      billing_frequency: 'monthly',
      next_payment_date: futureDate(12),
      category: 'fitness',
      is_paused: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'sub_demo_3',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'GitHub Copilot Student / Claude Pro',
      amount: 1200,
      billing_frequency: 'monthly',
      next_payment_date: futureDate(18),
      category: 'coding',
      is_paused: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'sub_demo_4',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Amazon Prime Student Annual',
      amount: 1499,
      billing_frequency: 'yearly',
      next_payment_date: futureDate(85),
      category: 'shopping',
      is_paused: false,
      created_at: new Date().toISOString()
    }
  ];

  localStorage.setItem(DEMO_SUBS_KEY, JSON.stringify(defaultSubs));
  return defaultSubs;
}

function saveLocalDemoSubscriptions(subs) {
  localStorage.setItem(DEMO_SUBS_KEY, JSON.stringify(subs));
}

// Fetch all subscriptions for a user
export async function fetchSubscriptions(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalDemoSubscriptions();
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('next_payment_date', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalDemoSubscriptions();
    }
    return data;
  } catch (err) {
    console.warn('Subscriptions fetch note, using local session:', err.message);
    return getLocalDemoSubscriptions();
  }
}

// Create a new subscription
export async function createSubscription({ userId, name, amount, billingFrequency, nextPaymentDate, category }) {
  if (!userId || userId.startsWith('00000000')) {
    const subs = getLocalDemoSubscriptions();
    const newSub = {
      id: 'sub_' + Date.now(),
      user_id: userId || '00000000-0000-0000-0000-000000000001',
      name: name.trim(),
      amount: parseFloat(amount),
      billing_frequency: billingFrequency || 'monthly',
      next_payment_date: nextPaymentDate,
      category: category || 'entertainment',
      is_paused: false,
      created_at: new Date().toISOString()
    };
    subs.push(newSub);
    saveLocalDemoSubscriptions(subs);
    return newSub;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: userId,
      name: name.trim(),
      amount: parseFloat(amount),
      billing_frequency: billingFrequency || 'monthly',
      next_payment_date: nextPaymentDate,
      category: category || 'entertainment',
      is_paused: false
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Toggle pause status
export async function togglePauseSubscription(id, currentStatus) {
  const newStatus = !currentStatus;

  if (id.startsWith('sub_')) {
    const subs = getLocalDemoSubscriptions();
    const sub = subs.find(s => s.id === id);
    if (sub) {
      sub.is_paused = newStatus;
      saveLocalDemoSubscriptions(subs);
      return sub;
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ is_paused: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete subscription
export async function deleteSubscription(id) {
  if (id.startsWith('sub_')) {
    const subs = getLocalDemoSubscriptions();
    const filtered = subs.filter(s => s.id !== id);
    saveLocalDemoSubscriptions(filtered);
    return true;
  }

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Calculate Monthly Cost and Upcoming Renewal count
 */
export function calculateSubscriptionMetrics(subscriptions) {
  let monthlyTotal = 0;
  let activeCount = 0;
  let renewalsWithin7Days = 0;

  const now = new Date();

  (subscriptions || []).forEach(sub => {
    if (!sub.is_paused) {
      activeCount++;
      // Normalize cost to monthly
      if (sub.billing_frequency === 'weekly') {
        monthlyTotal += sub.amount * 4.33;
      } else if (sub.billing_frequency === 'yearly') {
        monthlyTotal += sub.amount / 12;
      } else {
        monthlyTotal += sub.amount;
      }

      // Check upcoming renewal
      if (sub.next_payment_date) {
        const diffDays = Math.ceil((new Date(sub.next_payment_date) - now) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          renewalsWithin7Days++;
        }
      }
    }
  });

  return {
    monthlyTotal: Math.round(monthlyTotal),
    activeCount,
    totalCount: (subscriptions || []).length,
    renewalsWithin7Days
  };
}
