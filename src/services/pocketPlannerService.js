import { supabase } from '../lib/supabase';
import { getRemainingDaysInMonth } from '../utils/formatters';

/**
 * Pocket Planner Service (Feature 1)
 * Computes live metrics, alerts, and pacing for monthly student pocket money.
 */

export function calculatePocketPlan({ pocketMoney, totalSpent }) {
  const budget = Number(pocketMoney) || 8000;
  const spent = Number(totalSpent) || 0;
  const remaining = Math.max(0, budget - spent);
  const remainingDays = getRemainingDaysInMonth();
  
  // Daily recommended allowance
  const dailyAllowance = remaining / remainingDays;

  // Percentage of budget used
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

  // Status and Alerts
  let alertLevel = 'safe'; // 'safe' | 'caution' | 'critical'
  let alertMessage = 'You are comfortably within your campus budget!';

  if (percentUsed >= 100) {
    alertLevel = 'critical';
    alertMessage = `Budget Exceeded! You have spent ₹${(spent - budget).toFixed(0)} over your monthly pocket money.`;
  } else if (percentUsed >= 85) {
    alertLevel = 'critical';
    alertMessage = `High Alert: You have used ${percentUsed.toFixed(0)}% of your pocket money with ${remainingDays} days left.`;
  } else if (percentUsed >= 70) {
    alertLevel = 'caution';
    alertMessage = `Caution: You have used ${percentUsed.toFixed(0)}% of your pocket money. Keep daily spends under ₹${dailyAllowance.toFixed(0)}.`;
  }

  // Pace projection: What will happen by month-end at current spending rate?
  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const avgSpentPerDaySoFar = spent / currentDay;
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthEndSpent = avgSpentPerDaySoFar * totalDaysInMonth;
  const projectedSurplusOrDeficit = budget - projectedMonthEndSpent;

  return {
    budget,
    spent,
    remaining,
    remainingDays,
    dailyAllowance,
    percentUsed,
    alertLevel,
    alertMessage,
    avgSpentPerDaySoFar,
    projectedMonthEndSpent,
    projectedSurplusOrDeficit
  };
}

// Simulate impact of a new purchase
export function simulatePurchase({ currentRemaining, remainingDays, purchaseAmount }) {
  const afterAmount = Math.max(0, currentRemaining - purchaseAmount);
  const newDailyAllowance = afterAmount / remainingDays;
  const dailyDrop = (currentRemaining / remainingDays) - newDailyAllowance;

  return {
    afterAmount,
    newDailyAllowance,
    dailyDrop
  };
}
