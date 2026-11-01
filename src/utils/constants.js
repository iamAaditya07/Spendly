export const DEFAULT_CATEGORIES = [
  { id: 'canteen', name: 'Canteen & Food', type: 'expense', color: '#f97316', icon: 'UtensilsCrossed' },
  { id: 'hostel', name: 'Hostel & Rent', type: 'expense', color: '#6366f1', icon: 'Home' },
  { id: 'books', name: 'Books & Academics', type: 'expense', color: '#0ea5e9', icon: 'GraduationCap' },
  { id: 'transit', name: 'Metro & Travel', type: 'expense', color: '#10b981', icon: 'Bus' },
  { id: 'social', name: 'Events & Hangouts', type: 'expense', color: '#ec4899', icon: 'Sparkles' },
  { id: 'subscriptions', name: 'OTT & Subscriptions', type: 'expense', color: '#8b5cf6', icon: 'Tv' },
  { id: 'gadgets', name: 'Tech & Supplies', type: 'expense', color: '#14b8a6', icon: 'Laptop' },
  { id: 'health', name: 'Health & Fitness', type: 'expense', color: '#ef4444', icon: 'HeartPulse' },
  { id: 'other', name: 'Miscellaneous', type: 'expense', color: '#64748b', icon: 'Tag' },
  // Income categories
  { id: 'pocket_money', name: 'Monthly Pocket Money', type: 'income', color: '#10b981', icon: 'Wallet' },
  { id: 'stipend', name: 'Internship & Stipend', type: 'income', color: '#06b6d4', icon: 'Briefcase' },
  { id: 'freelance', name: 'Freelance & Gigs', type: 'income', color: '#8b5cf6', icon: 'Code' },
  { id: 'gift', name: 'Presents & Others', type: 'income', color: '#f59e0b', icon: 'Gift' }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', badge: null },
  { id: 'transactions', label: 'Transactions', icon: 'Receipt', badge: null },
  { id: 'add-transaction', label: 'Add Entry', icon: 'PlusCircle', badge: null },
  { id: 'pocket-planner', label: 'Pocket Money', icon: 'Wallet', badge: 'Special' },
  { id: 'split', label: 'Split with Friends', icon: 'Users', badge: 'Roommates' },
  { id: 'goals', label: 'Savings Goals', icon: 'Target', badge: null },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'CalendarClock', badge: null },
  { id: 'challenges', label: 'No-Spend Challenge', icon: 'Flame', badge: 'Streak' },
  { id: 'insights', label: 'Smart Insights', icon: 'TrendingUp', badge: 'AI-Ready' },
  { id: 'receipt-scanner', label: 'Receipt Scanner', icon: 'Camera', badge: 'OCR' },
  { id: 'financial-health', label: 'Financial Health', icon: 'Activity', badge: '0-100' },
  { id: 'finora-ai', label: 'Finora AI', icon: 'Bot', badge: 'Assistant' },
  { id: 'expense-calendar', label: 'Expense Calendar', icon: 'Calendar', badge: 'Timeline' },
  { id: 'reminders', label: 'Smart Reminders', icon: 'Bell', badge: 'Alerts' },
  { id: 'settings', label: 'Profile & Settings', icon: 'Settings', badge: null }
];
