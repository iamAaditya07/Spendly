import { supabase } from '../lib/supabase';

const DEMO_GROUPS_KEY = 'spendly_demo_groups';

function getLocalDemoGroups() {
  const saved = localStorage.getItem(DEMO_GROUPS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return []; // Clean empty array - zero dummy data
}

function saveLocalDemoGroups(groups) {
  localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(groups));
}

// Fetch all groups for a user
export async function fetchUserGroups(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalDemoGroups();
  }

  try {
    const { data, error } = await supabase
      .from('expense_groups')
      .select(`
        *,
        members:group_members(*),
        expenses:shared_expenses(*),
        settlements(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase groups fetch note, using local session:', err.message);
    return getLocalDemoGroups();
  }
}

// Create a new expense group
export async function createExpenseGroup({ userId, name, description, groupType, memberNames = [] }) {
  if (!userId || userId.startsWith('00000000')) {
    const groups = getLocalDemoGroups();
    const newGroup = {
      id: 'group_' + Date.now(),
      name: name.trim(),
      description: (description || '').trim(),
      group_type: groupType || 'roommates',
      currency: '₹',
      created_by: userId || '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
      members: [
        { id: 'mem_me', user_id: userId, name: 'You' },
        ...memberNames.map((m, idx) => ({
          id: 'mem_' + Date.now() + '_' + idx,
          user_id: 'user_' + m.toLowerCase().replace(/\s+/g, '_'),
          name: m
        }))
      ],
      expenses: [],
      settlements: []
    };
    groups.unshift(newGroup);
    saveLocalDemoGroups(groups);
    return newGroup;
  }

  // Supabase creation
  const { data: group, error: groupErr } = await supabase
    .from('expense_groups')
    .insert([{
      name: name.trim(),
      description: (description || '').trim(),
      group_type: groupType || 'roommates',
      created_by: userId
    }])
    .select()
    .single();

  if (groupErr) throw groupErr;

  // Add members
  const memberRows = [
    { group_id: group.id, user_id: userId, member_name: 'You', is_admin: true },
    ...memberNames.map(name => ({
      group_id: group.id,
      member_name: name,
      is_admin: false
    }))
  ];

  await supabase.from('group_members').insert(memberRows);
  return group;
}

// Add a shared expense to a group
export async function addSharedGroupExpense({ groupId, paidById, paidByName, title, amount, splitType, splits, date, notes }) {
  if (groupId.startsWith('group_')) {
    const groups = getLocalDemoGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      if (!group.expenses) group.expenses = [];
      const newExpense = {
        id: 'se_' + Date.now(),
        title: title.trim(),
        amount: parseFloat(amount),
        paid_by_name: paidByName,
        paid_by_id: paidById,
        split_type: splitType,
        date: date || new Date().toISOString().slice(0, 10),
        notes: (notes || '').trim(),
        splits: splits.map(s => ({
          member_name: s.memberName,
          user_id: s.userId,
          amount: parseFloat(s.amount)
        }))
      };
      group.expenses.unshift(newExpense);
      saveLocalDemoGroups(groups);
      return newExpense;
    }
  }

  // Supabase shared expense
  const { data: exp, error: expErr } = await supabase
    .from('shared_expenses')
    .insert([{
      group_id: groupId,
      paid_by: paidById,
      title: title.trim(),
      amount: parseFloat(amount),
      split_type: splitType,
      expense_date: date,
      notes: (notes || '').trim()
    }])
    .select()
    .single();

  if (expErr) throw expErr;

  // Insert splits
  const splitRows = splits.map(s => ({
    shared_expense_id: exp.id,
    user_id: s.userId || paidById,
    amount_owed: parseFloat(s.amount),
    has_settled: false
  }));

  await supabase.from('expense_splits').insert(splitRows);
  return exp;
}

// Record a settlement between friends
export async function recordGroupSettlement({ groupId, fromName, toName, amount, paymentReference }) {
  if (groupId.startsWith('group_')) {
    const groups = getLocalDemoGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      const newSet = {
        id: 'set_' + Date.now(),
        from_name: fromName,
        to_name: toName,
        amount: parseFloat(amount),
        date: new Date().toISOString().slice(0, 10),
        payment_reference: paymentReference || 'UPI / Cash'
      };
      if (!group.settlements) group.settlements = [];
      group.settlements.unshift(newSet);
      saveLocalDemoGroups(groups);
      return newSet;
    }
  }

  // Supabase settlement
  const { data, error } = await supabase
    .from('settlements')
    .insert([{
      group_id: groupId,
      amount: parseFloat(amount),
      notes: paymentReference
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Net Balances & "Who Owes Whom" calculation algorithm
 */
export function calculateGroupBalances(group) {
  if (!group || !group.members || group.members.length === 0) {
    return { balances: {}, debts: [], userOwed: 0, userOwes: 0 };
  }

  const net = {};
  group.members.forEach(m => {
    net[m.name] = 0;
  });

  // Calculate credits and debits from expenses
  (group.expenses || []).forEach(exp => {
    const payer = exp.paid_by_name;
    const total = exp.amount;

    if (net[payer] !== undefined) {
      net[payer] += total;
    }

    (exp.splits || []).forEach(split => {
      const debtor = split.member_name;
      if (net[debtor] !== undefined) {
        net[debtor] -= split.amount;
      }
    });
  });

  // Incorporate completed settlements
  (group.settlements || []).forEach(set => {
    if (net[set.from_name] !== undefined) {
      net[set.from_name] += set.amount;
    }
    if (net[set.to_name] !== undefined) {
      net[set.to_name] -= set.amount;
    }
  });

  // Debt Simplification Algorithm
  const debtors = [];
  const creditors = [];

  Object.entries(net).forEach(([name, amount]) => {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ name, amount: -rounded });
    } else if (rounded > 0.01) {
      creditors.push({ name, amount: rounded });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    if (settlementAmount > 0.01) {
      debts.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settlementAmount * 100) / 100
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  // Calculate specific user balance
  let userOwed = 0;
  let userOwes = 0;

  debts.forEach(d => {
    if (d.to.includes('You')) {
      userOwed += d.amount;
    } else if (d.from.includes('You')) {
      userOwes += d.amount;
    }
  });

  return {
    balances: net,
    debts,
    userOwed,
    userOwes
  };
}
