// Spendly Storage & Data Engine
const STORAGE_KEYS = {
  EXPENSES: 'spendly_expenses_v1',
  BUDGET: 'spendly_budget_v1',
  CURRENCY: 'spendly_currency_v1',
  THEME: 'spendly_theme_v1'
};

const CATEGORIES = {
  food: {
    id: 'food',
    name: 'Food & Dining',
    color: '#F97316',
    bgColor: '#FFF7ED',
    darkBgColor: 'rgba(249, 115, 22, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
  },
  groceries: {
    id: 'groceries',
    name: 'Groceries',
    color: '#10B981',
    bgColor: '#ECFDF5',
    darkBgColor: 'rgba(16, 185, 129, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`
  },
  housing: {
    id: 'housing',
    name: 'Housing & Rent',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    darkBgColor: 'rgba(99, 102, 241, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  },
  transport: {
    id: 'transport',
    name: 'Transportation',
    color: '#0EA5E9',
    bgColor: '#F0F9FF',
    darkBgColor: 'rgba(14, 165, 233, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M7 17v3"></path><path d="M17 17v3"></path><path d="M4 11h16"></path><circle cx="7" cy="14" r="1"></circle><circle cx="17" cy="14" r="1"></circle></svg>`
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    darkBgColor: 'rgba(236, 72, 153, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    darkBgColor: 'rgba(139, 92, 246, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities & Bills',
    color: '#EAB308',
    bgColor: '#FEFCE8',
    darkBgColor: 'rgba(234, 179, 8, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  },
  health: {
    id: 'health',
    name: 'Health & Fitness',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    darkBgColor: 'rgba(239, 68, 68, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`
  },
  personal: {
    id: 'personal',
    name: 'Personal Care',
    color: '#14B8A6',
    bgColor: '#F0FDFA',
    darkBgColor: 'rgba(20, 184, 166, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path></svg>`
  },
  other: {
    id: 'other',
    name: 'Other',
    color: '#64748B',
    bgColor: '#F8FAFC',
    darkBgColor: 'rgba(100, 116, 139, 0.15)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`
  }
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' }
];

class SpendlyStore {
  constructor() {
    this.initData();
  }

  initData() {
    // Check if expenses exist, if not preload clean sample data
    const existing = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!existing) {
      this.preloadSampleData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUDGET)) {
      localStorage.setItem(STORAGE_KEYS.BUDGET, '2400');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENCY)) {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, '$');
    }
  }

  preloadSampleData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    const pad = (n) => String(n).padStart(2, '0');
    const makeDate = (dayOffset) => {
      const d = new Date(currentYear, currentMonth, Math.max(1, Math.min(28, dayOffset)));
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    // Realistic curated expenses
    const sampleExpenses = [
      {
        id: 'exp_' + Date.now() + '_1',
        title: 'Monthly Apartment Rent',
        amount: 850.00,
        category: 'housing',
        date: makeDate(1),
        notes: 'Direct debit bank transfer'
      },
      {
        id: 'exp_' + Date.now() + '_2',
        title: 'Whole Foods Organic Groceries',
        amount: 114.50,
        category: 'groceries',
        date: makeDate(3),
        notes: 'Weekly fresh produce & staples'
      },
      {
        id: 'exp_' + Date.now() + '_3',
        title: 'High-speed Fiber Internet',
        amount: 65.00,
        category: 'utilities',
        date: makeDate(5),
        notes: 'Monthly utility bill'
      },
      {
        id: 'exp_' + Date.now() + '_4',
        title: 'Subway Pass & Transit reload',
        amount: 45.00,
        category: 'transport',
        date: makeDate(7),
        notes: 'Metropolitan monthly card'
      },
      {
        id: 'exp_' + Date.now() + '_5',
        title: 'Italian Bistro Dinner with Friends',
        amount: 58.20,
        category: 'food',
        date: makeDate(10),
        notes: 'Weekend dinner'
      },
      {
        id: 'exp_' + Date.now() + '_6',
        title: 'Cinema Tickets & Popcorn',
        amount: 32.00,
        category: 'entertainment',
        date: makeDate(12),
        notes: 'Movie night'
      },
      {
        id: 'exp_' + Date.now() + '_7',
        title: 'Local Supermarket Groceries',
        amount: 92.40,
        category: 'groceries',
        date: makeDate(15),
        notes: 'Pantry restocking'
      },
      {
        id: 'exp_' + Date.now() + '_8',
        title: 'Casual Summer Oxford Shirt',
        amount: 48.00,
        category: 'shopping',
        date: makeDate(18),
        notes: 'Work wardrobe update'
      },
      {
        id: 'exp_' + Date.now() + '_9',
        title: 'Artisan Coffee & Croissant',
        amount: 9.75,
        category: 'food',
        date: makeDate(20),
        notes: 'Morning coffee catchup'
      },
      {
        id: 'exp_' + Date.now() + '_10',
        title: 'Gym Membership & Recovery',
        amount: 55.00,
        category: 'health',
        date: makeDate(22),
        notes: 'Monthly fitness pass'
      },
      {
        id: 'exp_' + Date.now() + '_11',
        title: 'Electricity & Power Bill',
        amount: 74.30,
        category: 'utilities',
        date: makeDate(24),
        notes: 'Power grid bill'
      },
      {
        id: 'exp_' + Date.now() + '_12',
        title: 'Ride share home from downtown',
        amount: 23.50,
        category: 'transport',
        date: makeDate(26),
        notes: 'Late evening cab'
      },
      {
        id: 'exp_' + Date.now() + '_13',
        title: 'Weekly Fresh Market Veggies',
        amount: 41.20,
        category: 'groceries',
        date: makeDate(28),
        notes: 'Farmers market'
      }
    ];

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(sampleExpenses));
  }

  // Currency
  getCurrency() {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || '$';
  }

  setCurrency(symbol) {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, symbol);
  }

  // Budget
  getMonthlyBudget() {
    const b = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return b ? parseFloat(b) : 2400;
  }

  setMonthlyBudget(amount) {
    localStorage.setItem(STORAGE_KEYS.BUDGET, parseFloat(amount).toFixed(2));
  }

  // Theme
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // Expenses CRUD
  getAllExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse expenses:', e);
      return [];
    }
  }

  saveAllExpenses(expenses) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  addExpense(item) {
    const expenses = this.getAllExpenses();
    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: item.title.trim(),
      amount: parseFloat(item.amount),
      category: item.category || 'other',
      date: item.date, // 'YYYY-MM-DD'
      notes: (item.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    expenses.unshift(newExpense);
    this.saveAllExpenses(expenses);
    return newExpense;
  }

  updateExpense(id, updatedFields) {
    const expenses = this.getAllExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        ...updatedFields,
        amount: parseFloat(updatedFields.amount),
        title: updatedFields.title.trim(),
        updatedAt: new Date().toISOString()
      };
      this.saveAllExpenses(expenses);
      return expenses[index];
    }
    return null;
  }

  deleteExpense(id) {
    const expenses = this.getAllExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    this.saveAllExpenses(filtered);
    return filtered.length < expenses.length;
  }

  getExpensesForMonth(year, month) {
    // month is 0-indexed (0 = Jan, 11 = Dec)
    const all = this.getAllExpenses();
    return all.filter(exp => {
      if (!exp.date) return false;
      const [y, m] = exp.date.split('-').map(Number);
      return y === year && (m - 1) === month;
    }).sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort: newest added first
      if (b.createdAt && a.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }

  getMonthlyAnalytics(year, month) {
    const expenses = this.getExpensesForMonth(year, month);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Days in current selected month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Category breakdown
    const catMap = {};
    expenses.forEach(exp => {
      const catKey = exp.category in CATEGORIES ? exp.category : 'other';
      if (!catMap[catKey]) {
        catMap[catKey] = {
          category: CATEGORIES[catKey],
          total: 0,
          count: 0
        };
      }
      catMap[catKey].total += exp.amount;
      catMap[catKey].count += 1;
    });

    const categoryBreakdown = Object.values(catMap)
      .map(item => ({
        ...item,
        percentage: totalSpent > 0 ? (item.total / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Daily breakdown for the bar chart
    const dailyMap = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = 0;
    }

    expenses.forEach(exp => {
      const day = parseInt(exp.date.split('-')[2], 10);
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += exp.amount;
      }
    });

    const dailyBreakdown = Object.keys(dailyMap).map(d => ({
      day: parseInt(d, 10),
      amount: dailyMap[d]
    }));

    // Find highest spend day
    let highestDay = { day: 1, amount: 0 };
    dailyBreakdown.forEach(item => {
      if (item.amount > highestDay.amount) {
        highestDay = { day: item.day, amount: item.amount };
      }
    });

    // Average daily spend
    // If it's the current month, calculate up to current date or whole month
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const activeDays = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
    const averageDaily = totalSpent > 0 ? totalSpent / activeDays : 0;

    // Budget status
    const budget = this.getMonthlyBudget();
    const remainingBudget = budget - totalSpent;
    const budgetPercent = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;

    return {
      year,
      month,
      expenses,
      totalSpent,
      categoryBreakdown,
      dailyBreakdown,
      highestDay,
      averageDaily,
      daysInMonth,
      budget,
      remainingBudget,
      budgetPercent,
      transactionCount: expenses.length
    };
  }

  // Backup & Export / Import
  exportCSV(year, month) {
    const expenses = this.getExpensesForMonth(year, month);
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Notes'];
    const rows = expenses.map(e => [
      e.date,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      CATEGORIES[e.category] ? CATEGORIES[e.category].name : e.category,
      e.amount.toFixed(2),
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Spendly-Expenses-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency: this.getCurrency(),
      budget: this.getMonthlyBudget(),
      expenses: this.getAllExpenses()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.expenses)) {
        this.saveAllExpenses(data.expenses);
      } else if (Array.isArray(data)) {
        this.saveAllExpenses(data);
      }
      if (data.budget) {
        this.setMonthlyBudget(data.budget);
      }
      if (data.currency) {
        this.setCurrency(data.currency);
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  resetToSampleData() {
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    this.preloadSampleData();
  }

  clearAllData() {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  }
}

// Global instance
window.spendlyStore = new SpendlyStore();
