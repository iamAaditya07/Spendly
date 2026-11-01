import { supabase } from '../lib/supabase';

/**
 * Transactions Service
 * Handles CRUD operations with Supabase `transactions` table,
 * with localStorage fallback for demo/offline sessions.
 */

const DEMO_TX_KEY = 'spendly_demo_transactions';

function getLocalDemoTransactions() {
  const data = localStorage.getItem(DEMO_TX_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }

  // Pre-seed realistic campus expenses for demo
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const d = (day) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;

  const seeded = [
    {
      id: 'tx_demo_1',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 140,
      description: 'Hostel Canteen Lunch (Thali + Lassi)',
      type: 'expense',
      date: d(1),
      payment_method: 'UPI',
      notes: 'Split with Roommate',
      category: { id: 'canteen', name: 'Canteen & Food', color: '#f97316', type: 'expense' }
    },
    {
      id: 'tx_demo_2',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 50,
      description: 'Campus Metro Card Recharge',
      type: 'expense',
      date: d(3),
      payment_method: 'UPI',
      notes: 'Weekly transit to library',
      category: { id: 'transit', name: 'Metro & Travel', color: '#10b981', type: 'expense' }
    },
    {
      id: 'tx_demo_3',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 450,
      description: 'Data Structures & Algorithms Reference Book',
      type: 'expense',
      date: d(6),
      payment_method: 'Cash',
      notes: 'Used textbook from senior',
      category: { id: 'books', name: 'Books & Academics', color: '#0ea5e9', type: 'expense' }
    },
    {
      id: 'tx_demo_4',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 199,
      description: 'Spotify Student Premium Renewal',
      type: 'expense',
      date: d(10),
      payment_method: 'Card',
      notes: 'Student 50% discount plan',
      category: { id: 'subscriptions', name: 'OTT & Subscriptions', color: '#8b5cf6', type: 'expense' }
    },
    {
      id: 'tx_demo_5',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 320,
      description: 'Friday Night Chai & Maggi Hangout',
      type: 'expense',
      date: d(14),
      payment_method: 'UPI',
      notes: 'Hostel night study snack',
      category: { id: 'canteen', name: 'Canteen & Food', color: '#f97316', type: 'expense' }
    },
    {
      id: 'tx_demo_6',
      user_id: '00000000-0000-0000-0000-000000000001',
      amount: 8000,
      description: 'Monthly Pocket Money from Parents',
      type: 'income',
      date: d(1),
      payment_method: 'UPI',
      notes: 'GPay bank transfer',
      category: { id: 'pocket_money', name: 'Monthly Pocket Money', color: '#10b981', type: 'income' }
    }
  ];

  localStorage.setItem(DEMO_TX_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalDemoTransactions(txs) {
  localStorage.setItem(DEMO_TX_KEY, JSON.stringify(txs));
}

// Fetch all transactions for a user
export async function fetchTransactions(userId) {
  if (!userId) return [];

  // If in demo mode
  if (userId.startsWith('00000000')) {
    return getLocalDemoTransactions();
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, color, icon, type)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Supabase fetch failed, falling back to local session:', error.message);
    return getLocalDemoTransactions();
  }
}

// Add a new expense or income transaction
export async function createTransaction(item) {
  // If demo mode
  if (item.userId?.startsWith('00000000')) {
    const local = getLocalDemoTransactions();
    const newTx = {
      id: 'tx_demo_' + Date.now(),
      user_id: item.userId,
      category_id: item.categoryId || null,
      type: item.type || 'expense',
      amount: parseFloat(item.amount),
      description: item.description.trim(),
      date: item.date,
      payment_method: item.paymentMethod || 'UPI',
      notes: (item.notes || '').trim(),
      receipt_url: item.receiptUrl || null,
      receipt_items: item.receiptItems || null,
      is_campus_expense: Boolean(item.isCampusExpense),
      campus_category: item.campusCategory || null,
      category: { id: item.categoryId || 'other', name: item.type === 'income' ? 'Income' : 'Campus Expense', color: item.type === 'income' ? '#10b981' : '#f97316' },
      created_at: new Date().toISOString()
    };
    local.unshift(newTx);
    saveLocalDemoTransactions(local);
    return newTx;
  }

  const payload = {
    user_id: item.userId,
    category_id: item.categoryId || null,
    type: item.type || 'expense',
    amount: parseFloat(item.amount),
    description: item.description.trim(),
    date: item.date,
    payment_method: item.paymentMethod || 'UPI',
    notes: (item.notes || '').trim(),
    is_recurring: Boolean(item.isRecurring),
    receipt_url: item.receiptUrl || null,
    receipt_items: item.receiptItems || null,
    is_campus_expense: Boolean(item.isCampusExpense),
    campus_category: item.campusCategory || null
  };

  let { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select(`
      *,
      category:categories(id, name, color, icon, type)
    `)
    .single();

  // If Supabase reports schema cache column missing, fallback to core fields automatically
  if (error && (error.message?.includes('schema cache') || error.code === 'PGRST204' || error.message?.includes('campus_category') || error.message?.includes('receipt_url'))) {
    console.warn('Optional columns not migrated in Supabase yet. Retrying with core transaction fields:', error.message);
    const corePayload = {
      user_id: item.userId,
      category_id: item.categoryId || null,
      type: item.type || 'expense',
      amount: parseFloat(item.amount),
      description: item.description.trim(),
      date: item.date,
      payment_method: item.paymentMethod || 'UPI',
      notes: (item.notes || '').trim(),
      is_recurring: Boolean(item.isRecurring)
    };

    const retry = await supabase
      .from('transactions')
      .insert([corePayload])
      .select(`
        *,
        category:categories(id, name, color, icon, type)
      `)
      .single();

    if (!retry.error) {
      return retry.data;
    }
    error = retry.error;
  }

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  return data;
}

// Update an existing transaction
export async function updateTransaction(id, updatedFields) {
  if (id.startsWith('tx_demo_')) {
    const local = getLocalDemoTransactions();
    const index = local.findIndex(t => t.id === id);
    if (index !== -1) {
      local[index] = {
        ...local[index],
        ...updatedFields,
        amount: parseFloat(updatedFields.amount),
        description: updatedFields.description.trim(),
        notes: (updatedFields.notes || '').trim()
      };
      saveLocalDemoTransactions(local);
      return local[index];
    }
  }

  const payload = {
    ...updatedFields,
    amount: parseFloat(updatedFields.amount),
    description: updatedFields.description.trim(),
    notes: (updatedFields.notes || '').trim(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name, color, icon, type)
    `)
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }

  return data;
}

// Delete a transaction
export async function deleteTransaction(id) {
  if (id.startsWith('tx_demo_')) {
    const local = getLocalDemoTransactions();
    const filtered = local.filter(t => t.id !== id);
    saveLocalDemoTransactions(filtered);
    return true;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }

  return true;
}

// Export array of transactions to downloadable CSV
export function exportTransactionsCSV(transactions, filename = 'Spendly-Campus-Transactions.csv') {
  if (!transactions || transactions.length === 0) return false;

  const headers = ['Date', 'Description', 'Type', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
  const rows = transactions.map(t => [
    t.date,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.type.toUpperCase(),
    `"${(t.category?.name || 'General').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.payment_method || 'UPI',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
