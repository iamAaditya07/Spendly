import { supabase } from '../lib/supabase';
import { fetchTransactions } from './transactionsService';
import { fetchSavingsGoals } from './savingsService';
import { fetchSubscriptions } from './subscriptionService';
import { getProfile } from './profileService';

const DEMO_HEALTH_SCORES_KEY = 'spendly_demo_health_scores';

function getLocalDemoHealthScores() {
  const data = localStorage.getItem(DEMO_HEALTH_SCORES_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }

  // Pre-seed realistic 6-month historical trajectory for demo
  const now = new Date();
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const seeded = months.map((m, idx) => ({
    id: `health_demo_${idx + 1}`,
    month: m,
    overall_score: 58 + idx * 5, // 58, 63, 68, 73, 78, 83
    budget_score: 12 + Math.min(idx, 6),
    savings_score: 10 + Math.min(idx, 8),
    consistency_score: 14 + (idx % 3),
    emergency_score: 11 + idx,
    subscription_score: 11 + Math.min(idx, 5),
    tier: (58 + idx * 5) >= 70 ? 'Healthy' : 'Fair',
    calculated_at: `2026-0${idx + 5}-28`
  }));

  localStorage.setItem(DEMO_HEALTH_SCORES_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalDemoHealthScores(scores) {
  localStorage.setItem(DEMO_HEALTH_SCORES_KEY, JSON.stringify(scores));
}

/**
 * Transparent scoring formula calculation across 5 Pillars (20 points each):
 * 1. Budget Adherence (20 pts)
 * 2. Savings Habits (20 pts)
 * 3. Spending Consistency (20 pts)
 * 4. Emergency Cushion (20 pts)
 * 5. Subscription Burden (20 pts)
 */
export async function calculateFinancialHealthScore(userId) {
  // Fetch real financial figures
  const [profile, transactions, goals, subscriptions] = await Promise.all([
    getProfile(userId).catch(() => ({ monthly_pocket_money: 8000 })),
    fetchTransactions(userId).catch(() => []),
    fetchSavingsGoals(userId).catch(() => []),
    fetchSubscriptions(userId).catch(() => [])
  ]);

  const pocketMoney = parseFloat(profile?.monthly_pocket_money || 8000);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter current month transactions
  const currentMonthTx = transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthExpenses = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentMonthIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const effectiveIncome = Math.max(pocketMoney, currentMonthIncome, 4000);

  // ----------------------------------------------------
  // Pillar 1: Monthly Budget Adherence (20 pts)
  // ----------------------------------------------------
  let budgetScore = 20;
  const spendRatio = currentMonthExpenses / effectiveIncome;

  if (spendRatio <= 0.65) {
    budgetScore = 20;
  } else if (spendRatio <= 0.80) {
    budgetScore = 17;
  } else if (spendRatio <= 0.90) {
    budgetScore = 13;
  } else if (spendRatio <= 1.00) {
    budgetScore = 8;
  } else {
    budgetScore = Math.max(2, Math.round(8 - (spendRatio - 1.0) * 15));
  }

  // ----------------------------------------------------
  // Pillar 2: Savings Habits (20 pts)
  // ----------------------------------------------------
  let savingsScore = 0;
  const totalTargetSavings = goals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
  const totalCurrentSavings = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);

  if (goals.length === 0) {
    savingsScore = 6; // Encouragement baseline
  } else {
    const goalsCompletionRatio = totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) : 0;
    const savingsRateRatio = totalCurrentSavings / (effectiveIncome || 1);

    if (savingsRateRatio >= 0.20 || goalsCompletionRatio >= 0.75) {
      savingsScore = 20;
    } else if (savingsRateRatio >= 0.15 || goalsCompletionRatio >= 0.50) {
      savingsScore = 16;
    } else if (savingsRateRatio >= 0.10 || goalsCompletionRatio >= 0.30) {
      savingsScore = 12;
    } else if (savingsRateRatio > 0.02 || goalsCompletionRatio > 0.10) {
      savingsScore = 8;
    } else {
      savingsScore = 5;
    }
  }

  // ----------------------------------------------------
  // Pillar 3: Spending Consistency & Volatility (20 pts)
  // ----------------------------------------------------
  let consistencyScore = 16;
  const expenseAmounts = currentMonthTx
    .filter((t) => t.type === 'expense')
    .map((t) => parseFloat(t.amount || 0));

  if (expenseAmounts.length >= 4) {
    const mean = expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length;
    const variance = expenseAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expenseAmounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0; // Coefficient of Variation

    if (cv <= 0.70) {
      consistencyScore = 20; // Exceptionally steady spending
    } else if (cv <= 1.10) {
      consistencyScore = 16; // Moderate variance
    } else if (cv <= 1.50) {
      consistencyScore = 12; // High volatility spikes
    } else {
      consistencyScore = 8;  // Extreme impulse spikes
    }
  }

  // ----------------------------------------------------
  // Pillar 4: Emergency Fund / Buffer Cushion (20 pts)
  // ----------------------------------------------------
  let emergencyScore = 14;
  const netSurplus = effectiveIncome - currentMonthExpenses;
  const cushionRatio = netSurplus / (effectiveIncome * 0.4 || 1);

  if (cushionRatio >= 1.2) {
    emergencyScore = 20;
  } else if (cushionRatio >= 0.8) {
    emergencyScore = 16;
  } else if (cushionRatio >= 0.4) {
    emergencyScore = 12;
  } else if (cushionRatio > 0) {
    emergencyScore = 8;
  } else {
    emergencyScore = 3; // In the red
  }

  // ----------------------------------------------------
  // Pillar 5: Subscription Burden Ratio (20 pts)
  // ----------------------------------------------------
  let subscriptionScore = 20;
  const activeSubs = subscriptions.filter((s) => !s.is_paused);
  const monthlySubTotal = activeSubs.reduce((sum, s) => {
    const amt = parseFloat(s.amount || 0);
    if (s.billing_frequency === 'yearly') return sum + amt / 12;
    if (s.billing_frequency === 'weekly') return sum + amt * 4.33;
    return sum + amt;
  }, 0);

  const subRatio = monthlySubTotal / (effectiveIncome || 1);
  if (monthlySubTotal === 0) {
    subscriptionScore = 20;
  } else if (subRatio <= 0.08) {
    subscriptionScore = 19;
  } else if (subRatio <= 0.15) {
    subscriptionScore = 15;
  } else if (subRatio <= 0.25) {
    subscriptionScore = 10;
  } else {
    subscriptionScore = 5; // Heavy recurring drag
  }

  // Overall Score (0 to 100)
  const overallScore = Math.min(
    100,
    Math.max(5, budgetScore + savingsScore + consistencyScore + emergencyScore + subscriptionScore)
  );

  // Grade & Tier
  let tier = 'Fair';
  let grade = 'B';
  let badgeColor = '#f59e0b';

  if (overallScore >= 85) {
    tier = 'Exceptional';
    grade = 'A+';
    badgeColor = '#10b981';
  } else if (overallScore >= 70) {
    tier = 'Healthy';
    grade = 'A';
    badgeColor = '#6366f1';
  } else if (overallScore >= 50) {
    tier = 'Fair';
    grade = 'B';
    badgeColor = '#06b6d4';
  } else if (overallScore >= 35) {
    tier = 'Vulnerable';
    grade = 'C';
    badgeColor = '#f97316';
  } else {
    tier = 'Critical';
    grade = 'D';
    badgeColor = '#ef4444';
  }

  // ----------------------------------------------------
  // Transparent Diagnostic Breakdown
  // ----------------------------------------------------
  const pillars = [
    {
      id: 'budget',
      name: 'Budget Adherence',
      score: budgetScore,
      max: 20,
      description: `${Math.round(spendRatio * 100)}% of monthly pocket money used`,
      status: budgetScore >= 16 ? 'Strong' : budgetScore >= 11 ? 'Moderate' : 'Needs Attention',
      color: '#6366f1'
    },
    {
      id: 'savings',
      name: 'Savings Habits',
      score: savingsScore,
      max: 20,
      description: goals.length > 0 ? `${goals.length} active savings goal(s)` : 'No active savings goals',
      status: savingsScore >= 16 ? 'Strong' : savingsScore >= 11 ? 'Moderate' : 'Needs Attention',
      color: '#10b981'
    },
    {
      id: 'consistency',
      name: 'Spending Consistency',
      score: consistencyScore,
      max: 20,
      description: 'Variance & weekend spike frequency',
      status: consistencyScore >= 16 ? 'Steady' : 'Spike-Prone',
      color: '#f59e0b'
    },
    {
      id: 'emergency',
      name: 'Safety Cushion',
      score: emergencyScore,
      max: 20,
      description: netSurplus > 0 ? `₹${Math.round(netSurplus).toLocaleString()} remaining surplus` : 'Deficit / Zero buffer',
      status: emergencyScore >= 15 ? 'Safe' : 'Fragile',
      color: '#06b6d4'
    },
    {
      id: 'subscriptions',
      name: 'Subscription Overhead',
      score: subscriptionScore,
      max: 20,
      description: `₹${Math.round(monthlySubTotal).toLocaleString()}/mo (${Math.round(subRatio * 100)}% of income)`,
      status: subscriptionScore >= 15 ? 'Low Drag' : 'High Overhead',
      color: '#ec4899'
    }
  ];

  // ----------------------------------------------------
  // Personalized Improvement Recommendations
  // ----------------------------------------------------
  const recommendations = [];

  if (budgetScore < 15) {
    recommendations.push({
      id: 'rec_budget',
      pillar: 'Budget Adherence',
      title: 'Adopt Daily Allowance Caps',
      description: `You have consumed ${Math.round(spendRatio * 100)}% of this month's pocket money. Switch to the Pocket Money Planner to lock in a safe daily limit for the remaining days.`,
      priority: 'high',
      page: 'pocket-planner',
      actionLabel: 'Set Daily Limit'
    });
  }

  if (savingsScore < 14) {
    recommendations.push({
      id: 'rec_savings',
      pillar: 'Savings Habits',
      title: 'Automate a ₹500 Campus Micro-Goal',
      description: 'Creating small recurring savings habits builds high financial resilience. Start by saving for a tech gadget or semester trip.',
      priority: 'medium',
      page: 'goals',
      actionLabel: 'Create Savings Goal'
    });
  }

  if (consistencyScore < 15) {
    recommendations.push({
      id: 'rec_consistency',
      pillar: 'Spending Consistency',
      title: 'Cap Weekend Canteen Spikes',
      description: 'Noticeable spending clusters were detected on weekends. Challenge yourself with a 2-day No-Spend weekend sprint.',
      priority: 'medium',
      page: 'challenges',
      actionLabel: 'Join No-Spend Challenge'
    });
  }

  if (subscriptionScore < 15) {
    recommendations.push({
      id: 'rec_subscriptions',
      pillar: 'Subscription Overhead',
      title: 'Audit & Split Recurring Subscriptions',
      description: `Recurring OTT and software services consume ₹${Math.round(monthlySubTotal)} monthly. Pause unused services or split Spotify/Netflix plans with roommates.`,
      priority: 'high',
      page: 'subscriptions',
      actionLabel: 'Audit Subscriptions'
    });
  }

  if (emergencyScore < 12) {
    recommendations.push({
      id: 'rec_emergency',
      pillar: 'Safety Cushion',
      title: 'Build a ₹3,000 Campus Emergency Buffer',
      description: 'Keep a small untouched fund to cover sudden lab fee assessments, broken phone chargers, or medical prescriptions.',
      priority: 'high',
      page: 'emergency-fund',
      actionLabel: 'Emergency Fund'
    });
  }

  // Always keep at least 2 positive reinforcement tips
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_excellence',
      pillar: 'Overall Fitness',
      title: 'Maintain Your Disciplined Pacing',
      description: 'Your budget, savings habits, and low subscription drag place you in the top 10% of student money managers!',
      priority: 'low',
      page: 'dashboard',
      actionLabel: 'View Dashboard'
    });
  }

  const result = {
    overallScore,
    grade,
    tier,
    badgeColor,
    pillars,
    recommendations,
    spendRatio,
    effectiveIncome,
    currentMonthExpenses,
    monthlySubTotal,
    calculatedAt: new Date().toISOString()
  };

  // Save score snapshot to history
  await saveScoreSnapshot(userId, result);

  return result;
}

/**
 * Persists score snapshot for historical tracking
 */
async function saveScoreSnapshot(userId, data) {
  const isDemo = userId?.startsWith('00000000');
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'short' });

  const snapshot = {
    id: 'health_' + Date.now(),
    user_id: userId,
    month: monthName,
    overall_score: data.overallScore,
    budget_score: data.pillars[0].score,
    savings_score: data.pillars[1].score,
    consistency_score: data.pillars[2].score,
    emergency_score: data.pillars[3].score,
    subscription_score: data.pillars[4].score,
    tier: data.tier,
    calculated_at: now.toISOString().split('T')[0]
  };

  if (isDemo) {
    const history = getLocalDemoHealthScores();
    // Update or append current month
    const existingIdx = history.findIndex((h) => h.month === monthName);
    if (existingIdx !== -1) {
      history[existingIdx] = snapshot;
    } else {
      history.push(snapshot);
    }
    saveLocalDemoHealthScores(history);
  } else {
    try {
      await supabase.from('financial_health_scores').insert([{
        user_id: userId,
        overall_score: data.overallScore,
        budget_score: data.pillars[0].score,
        savings_score: data.pillars[1].score,
        consistency_score: data.pillars[2].score,
        emergency_score: data.pillars[3].score,
        subscription_score: data.pillars[4].score,
        tier: data.tier,
        recommendations: data.recommendations,
        calculated_at: snapshot.calculated_at
      }]);
    } catch (e) {
      console.warn('Could not save health score to Supabase:', e.message);
    }
  }
}

/**
 * Fetches historical health score snapshots
 */
export async function getHealthScoreHistory(userId) {
  if (userId?.startsWith('00000000')) {
    return getLocalDemoHealthScores();
  }

  try {
    const { data, error } = await supabase
      .from('financial_health_scores')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: true })
      .limit(12);

    if (error || !data || data.length === 0) {
      return getLocalDemoHealthScores();
    }

    return data.map((d) => {
      const date = new Date(d.calculated_at);
      return {
        ...d,
        month: date.toLocaleString('default', { month: 'short' })
      };
    });
  } catch (e) {
    return getLocalDemoHealthScores();
  }
}
