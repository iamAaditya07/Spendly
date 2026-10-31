import { supabase } from '../lib/supabase';

/**
 * Savings Goals Service (Feature 3)
 * Handles CRUD operations and contributions for student savings goals.
 */

const DEMO_GOALS_KEY = 'spendly_demo_savings_goals';

function getLocalDemoGoals() {
  const saved = localStorage.getItem(DEMO_GOALS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }

  // Preload a clean sample student goal
  const defaultGoals = [
    {
      id: 'goal_demo_1',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Coding Laptop (MacBook Air / ThinkPad)',
      target_amount: 65000,
      current_amount: 32500,
      target_date: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
      category: 'laptop',
      is_completed: false,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      contributions: [
        { id: 'c_1', amount: 20000, date: '2026-09-01', notes: 'Semester internship bonus' },
        { id: 'c_2', amount: 12500, date: '2026-10-15', notes: 'Saved from pocket money' }
      ]
    },
    {
      id: 'goal_demo_2',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Goa Campus Trip with Friends',
      target_amount: 12000,
      current_amount: 8400,
      target_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      category: 'trip',
      is_completed: false,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      contributions: [
        { id: 'c_3', amount: 5000, date: '2026-10-01', notes: 'Initial deposit' },
        { id: 'c_4', amount: 3400, date: '2026-10-25', notes: 'Freelance design project' }
      ]
    }
  ];

  localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(defaultGoals));
  return defaultGoals;
}

function saveLocalDemoGoals(goals) {
  localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(goals));
}

// Fetch all savings goals
export async function fetchSavingsGoals(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalDemoGoals();
  }

  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select(`
        *,
        contributions:savings_contributions(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalDemoGoals();
    }
    return data;
  } catch (err) {
    console.warn('Savings fetch note, using local session:', err.message);
    return getLocalDemoGoals();
  }
}

// Create a new savings goal
export async function createSavingsGoal({ userId, title, targetAmount, currentAmount = 0, targetDate, category }) {
  if (!userId || userId.startsWith('00000000')) {
    const goals = getLocalDemoGoals();
    const newGoal = {
      id: 'goal_' + Date.now(),
      user_id: userId || '00000000-0000-0000-0000-000000000001',
      title: title.trim(),
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      target_date: targetDate,
      category: category || 'general',
      is_completed: parseFloat(currentAmount) >= parseFloat(targetAmount),
      created_at: new Date().toISOString(),
      contributions: currentAmount > 0 ? [
        { id: 'c_init', amount: parseFloat(currentAmount), date: new Date().toISOString().slice(0, 10), notes: 'Initial savings' }
      ] : []
    };
    goals.unshift(newGoal);
    saveLocalDemoGoals(goals);
    return newGoal;
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .insert([{
      user_id: userId,
      title: title.trim(),
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      target_date: targetDate,
      category: category || 'general',
      is_completed: parseFloat(currentAmount) >= parseFloat(targetAmount)
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add money towards a goal
export async function addSavingsContribution({ goalId, userId, amount, notes }) {
  const addVal = parseFloat(amount);

  if (goalId.startsWith('goal_')) {
    const goals = getLocalDemoGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.current_amount = (goal.current_amount || 0) + addVal;
      if (goal.current_amount >= goal.target_amount) {
        goal.is_completed = true;
      }
      if (!goal.contributions) goal.contributions = [];
      goal.contributions.unshift({
        id: 'c_' + Date.now(),
        amount: addVal,
        date: new Date().toISOString().slice(0, 10),
        notes: notes || 'Contribution'
      });
      saveLocalDemoGoals(goals);
      return goal;
    }
  }

  // Supabase contribution
  await supabase
    .from('savings_contributions')
    .insert([{
      goal_id: goalId,
      user_id: userId,
      amount: addVal,
      notes
    }]);

  // Update current_amount in savings_goals
  const { data: currentGoal } = await supabase
    .from('savings_goals')
    .select('current_amount, target_amount')
    .eq('id', goalId)
    .single();

  const newCurrent = (currentGoal?.current_amount || 0) + addVal;
  const isCompleted = newCurrent >= (currentGoal?.target_amount || 0);

  const { data: updated, error } = await supabase
    .from('savings_goals')
    .update({
      current_amount: newCurrent,
      is_completed: isCompleted
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// Delete a goal
export async function deleteSavingsGoal(id) {
  if (id.startsWith('goal_')) {
    const goals = getLocalDemoGoals();
    const filtered = goals.filter(g => g.id !== id);
    saveLocalDemoGoals(filtered);
    return true;
  }

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Calculate recommended monthly savings to hit target on time
 */
export function calculateSavingsPacing(goal) {
  const remaining = Math.max(0, goal.target_amount - (goal.current_amount || 0));
  const percent = Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100));

  let monthsLeft = 1;
  let daysLeft = 30;

  if (goal.target_date) {
    const diffTime = new Date(goal.target_date) - new Date();
    daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  }

  const recommendedMonthly = Math.round(remaining / monthsLeft);

  return {
    remaining,
    percent,
    daysLeft,
    monthsLeft,
    recommendedMonthly,
    isCompleted: (goal.current_amount || 0) >= goal.target_amount
  };
}
