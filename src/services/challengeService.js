import { supabase } from '../lib/supabase';

/**
 * No-Spend Challenge Service (Feature 5)
 * Gamified habit tracker with streaks, badges, and money saved calculations.
 */

const DEMO_CHALLENGES_KEY = 'spendly_demo_challenges';

const BADGE_DEFINITIONS = [
  { id: 'badge_1', title: 'First Step', desc: 'Completed 1 full No-Spend day', icon: 'Footprints', minStreak: 1, color: '#10b981' },
  { id: 'badge_3', title: 'Weekend Warrior', desc: 'Survived a 3-day weekend without spending', icon: 'Shield', minStreak: 3, color: '#0ea5e9' },
  { id: 'badge_7', title: '7-Day Iron Will', desc: 'Maintained 7 consecutive No-Spend days', icon: 'Flame', minStreak: 7, color: '#f59e0b' },
  { id: 'badge_14', title: 'Frugal Master', desc: 'Crushed a 14-day campus savings challenge', icon: 'Award', minStreak: 14, color: '#8b5cf6' },
  { id: 'badge_30', title: 'Centurion Legend', desc: '30 days of supreme financial discipline', icon: 'Crown', minStreak: 30, color: '#ec4899' }
];

function getLocalDemoChallenges() {
  const saved = localStorage.getItem(DEMO_CHALLENGES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const d = (day) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;

  const defaultChallenges = [
    {
      id: 'chal_demo_1',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: '7-Day Campus No-Spend Sprint',
      challenge_type: 'weekly',
      start_date: d(15),
      end_date: d(22),
      target_savings: 1800,
      status: 'active',
      streak: 4,
      checkins: [
        { date: d(15), is_no_spend: true, saved: 250 },
        { date: d(16), is_no_spend: true, saved: 250 },
        { date: d(17), is_no_spend: true, saved: 250 },
        { date: d(18), is_no_spend: true, saved: 250 }
      ]
    },
    {
      id: 'chal_demo_2',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Weekend Canteen Fast (Zero Junk Food)',
      challenge_type: 'daily',
      start_date: d(5),
      end_date: d(7),
      target_savings: 800,
      status: 'completed',
      streak: 3,
      checkins: [
        { date: d(5), is_no_spend: true, saved: 280 },
        { date: d(6), is_no_spend: true, saved: 280 },
        { date: d(7), is_no_spend: true, saved: 280 }
      ]
    }
  ];

  localStorage.setItem(DEMO_CHALLENGES_KEY, JSON.stringify(defaultChallenges));
  return defaultChallenges;
}

function saveLocalDemoChallenges(chals) {
  localStorage.setItem(DEMO_CHALLENGES_KEY, JSON.stringify(chals));
}

// Fetch all challenges for a user
export async function fetchChallenges(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalDemoChallenges();
  }

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        checkins:challenge_progress(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalDemoChallenges();
    }
    return data;
  } catch (err) {
    console.warn('Challenges fetch note, using local session:', err.message);
    return getLocalDemoChallenges();
  }
}

// Create a new challenge
export async function createChallenge({ userId, title, challengeType, durationDays = 7, targetSavings = 1500 }) {
  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + durationDays * 86400000).toISOString().slice(0, 10);

  if (!userId || userId.startsWith('00000000')) {
    const chals = getLocalDemoChallenges();
    const newChal = {
      id: 'chal_' + Date.now(),
      user_id: userId || '00000000-0000-0000-0000-000000000001',
      title: title.trim(),
      challenge_type: challengeType || 'weekly',
      start_date: startDate,
      end_date: endDate,
      target_savings: parseFloat(targetSavings) || 1500,
      status: 'active',
      streak: 0,
      checkins: [],
      created_at: new Date().toISOString()
    };
    chals.unshift(newChal);
    saveLocalDemoChallenges(chals);
    return newChal;
  }

  const { data, error } = await supabase
    .from('challenges')
    .insert([{
      user_id: userId,
      title: title.trim(),
      challenge_type: challengeType,
      start_date: startDate,
      end_date: endDate,
      target_savings: parseFloat(targetSavings) || 1500,
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Record daily check-in (successful no-spend day)
export async function recordDailyCheckin({ challengeId, userId, date, savedAmount = 250 }) {
  const checkinDate = date || new Date().toISOString().slice(0, 10);

  if (challengeId.startsWith('chal_')) {
    const chals = getLocalDemoChallenges();
    const chal = chals.find(c => c.id === challengeId);
    if (chal) {
      if (!chal.checkins) chal.checkins = [];
      const alreadyCheckedIn = chal.checkins.some(c => c.date === checkinDate);
      if (!alreadyCheckedIn) {
        chal.checkins.push({
          date: checkinDate,
          is_no_spend: true,
          saved: parseFloat(savedAmount)
        });
        chal.streak = (chal.streak || 0) + 1;
        saveLocalDemoChallenges(chals);
      }
      return chal;
    }
  }

  // Supabase check-in
  const { data, error } = await supabase
    .from('challenge_progress')
    .insert([{
      challenge_id: challengeId,
      user_id: userId,
      date: checkinDate,
      is_no_spend_day: true,
      amount_saved: parseFloat(savedAmount)
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Compute Streaks, Badges and Estimated Money Saved
 */
export function calculateChallengeStats(challenges) {
  let currentStreak = 0;
  let totalSaved = 0;
  let totalSuccessfulDays = 0;

  (challenges || []).forEach(c => {
    const checkinList = c.checkins || [];
    totalSuccessfulDays += checkinList.length;
    checkinList.forEach(item => {
      totalSaved += item.saved || item.amount_saved || 250;
    });

    if (c.status === 'active') {
      currentStreak = Math.max(currentStreak, c.streak || checkinList.length);
    }
  });

  // Calculate unlocked badges based on total successful days or streak
  const badgesWithStatus = BADGE_DEFINITIONS.map(badge => {
    const isUnlocked = currentStreak >= badge.minStreak || totalSuccessfulDays >= badge.minStreak;
    return {
      ...badge,
      isUnlocked,
      progress: Math.min(100, Math.round((Math.max(currentStreak, totalSuccessfulDays) / badge.minStreak) * 100))
    };
  });

  return {
    currentStreak,
    totalSaved,
    totalSuccessfulDays,
    badges: badgesWithStatus
  };
}
