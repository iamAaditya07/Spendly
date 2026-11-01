import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  getMonthCalendarData,
  addTransactionFromCalendar
} from '../services/calendarService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Tv,
  Receipt,
  Wallet,
  Clock,
  CheckCircle,
  Tag,
  CreditCard,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ExpenseCalendarPage() {
  const { user } = useAuth();
  const { setCurrentPage } = useApp();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);

  // Selected date key (e.g. '2026-11-01')
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // Quick Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [modalAmount, setModalAmount] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalCategory, setModalCategory] = useState('canteen');
  const [modalPaymentMethod, setModalPaymentMethod] = useState('UPI');
  const [savingTransaction, setSavingTransaction] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCalendar();
    }
  }, [user?.id, currentYear, currentMonth]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const data = await getMonthCalendarData(user?.id, currentYear, currentMonth);
      setCalendarData(data);

      // If selected date is not in this month, select the 1st of the month
      const currentMonthPrefix = `${currentYear}-${pad(currentMonth + 1)}-`;
      if (!selectedDate.startsWith(currentMonthPrefix)) {
        setSelectedDate(`${currentMonthPrefix}01`);
      }
    } catch (e) {
      console.error('Error loading calendar data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayKey);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!modalAmount || parseFloat(modalAmount) <= 0 || !modalDescription.trim()) {
      alert('Please enter a valid description and amount.');
      return;
    }

    setSavingTransaction(true);
    try {
      await addTransactionFromCalendar({
        userId: user?.id,
        date: selectedDate,
        description: modalDescription.trim(),
        amount: parseFloat(modalAmount),
        type: modalType,
        categoryId: modalCategory,
        paymentMethod: modalPaymentMethod
      });

      setShowAddModal(false);
      setModalAmount('');
      setModalDescription('');
      loadCalendar();
    } catch (err) {
      console.error('Quick add error:', err);
      alert('Failed to save transaction: ' + err.message);
    } finally {
      setSavingTransaction(false);
    }
  };

  const selectedDayData = calendarData?.dailyMap?.[selectedDate] || {
    day: parseInt(selectedDate.split('-')[2] || '1', 10),
    date: selectedDate,
    expenses: [],
    incomes: [],
    totalExpense: 0,
    totalIncome: 0,
    subscriptionsDue: []
  };

  const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');
  const incomeCategories = DEFAULT_CATEGORIES.filter((c) => c.type === 'income');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Expense Calendar
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Interactive daily timeline. Track spending density, subscription renewals, and log transactions directly by date.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToday}
            className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm"
          >
            Today
          </button>
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Month's Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(calendarData?.totalMonthExpense || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            Across {calendarData?.activeSpendDays || 0} active days
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Month's Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(calendarData?.totalMonthIncome || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Pocket money & credits</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Net Monthly Cashflow</span>
            <Wallet className="w-4 h-4 text-brand-500" />
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold ${(calendarData?.netBalance || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(calendarData?.netBalance || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Income minus total outlays</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Zero-Spend Days</span>
            <CheckCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {Math.max(0, (calendarData?.daysCount || 30) - (calendarData?.activeSpendDays || 0))} Days
          </p>
          <p className="text-[11px] text-slate-400">Days without expenditure</p>
        </div>
      </div>

      {/* Weekly Spending Breakdown Bar */}
      {calendarData?.weeklyTotals && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Weekly Spending Distribution
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {calendarData.weeklyTotals.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <span className="text-[11px] text-slate-400 font-medium">{w.week}</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(w.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout: 7-Column Calendar Grid + Selected Day Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            {WEEKDAY_NAMES.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading monthly calendar...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Preceding blank days */}
              {Array.from({ length: calendarData?.firstDay || 0 }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[72px] sm:min-h-[88px] rounded-xl bg-slate-50/30 dark:bg-slate-950/20" />
              ))}

              {/* Month Days */}
              {Array.from({ length: calendarData?.daysCount || 30 }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
                const dayInfo = calendarData?.dailyMap?.[dateKey];
                const isSelected = selectedDate === dateKey;
                const isToday = todayKey === dateKey;
                const hasExpense = (dayInfo?.totalExpense || 0) > 0;
                const hasIncome = (dayInfo?.totalIncome || 0) > 0;
                const hasSub = (dayInfo?.subscriptionsDue?.length || 0) > 0;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-h-[72px] sm:min-h-[88px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left select-none relative group ${
                      isSelected
                        ? 'border-brand-600 dark:border-brand-500 bg-brand-50/30 dark:bg-brand-950/30 ring-2 ring-brand-500/20 shadow-sm'
                        : isToday
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Top Row: Date Number & Today Dot */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-brand-600 dark:text-brand-400 font-black'
                            : isToday
                            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" title="Today" />
                      )}
                    </div>

                    {/* Middle: Indicators / Amount badges */}
                    <div className="space-y-0.5 mt-1">
                      {hasExpense && (
                        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate">
                          -{Math.round(dayInfo.totalExpense)}
                        </div>
                      )}
                      {hasIncome && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          +{Math.round(dayInfo.totalIncome)}
                        </div>
                      )}
                      {hasSub && (
                        <div className="text-[9px] font-extrabold px-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 truncate flex items-center gap-0.5">
                          <Tv className="w-2.5 h-2.5 shrink-0" />
                          <span>{dayInfo.subscriptionsDue[0].name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Quick dot indicators for mobile */}
                    <div className="flex items-center gap-1 mt-auto pt-1">
                      {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {hasSub && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Detail Drawer (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Selected Date
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatDate(selectedDate)}
              </h3>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 shadow-sm transition-colors flex items-center gap-1 text-xs font-bold"
              title="Add Transaction on this Date"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Daily Financial Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60">
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                Spent Today
              </span>
              <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(selectedDayData.totalExpense)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                Income Today
              </span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(selectedDayData.totalIncome)}
              </p>
            </div>
          </div>

          {/* Subscriptions Due on this Date */}
          {selectedDayData.subscriptionsDue.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/80 space-y-2">
              <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                Subscription Payment Due
              </span>
              {selectedDayData.subscriptionsDue.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">
                    {formatCurrency(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Transactions List on this Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Day's Ledger ({selectedDayData.expenses.length + selectedDayData.incomes.length})</span>
            </div>

            {selectedDayData.expenses.length === 0 && selectedDayData.incomes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <p>No transactions logged for this day.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                >
                  + Add Entry on this date
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
                {/* Income entries */}
                {selectedDayData.incomes.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.description}</p>
                        <span className="text-[10px] text-slate-400">{tx.payment_method || 'UPI'}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}

                {/* Expense entries */}
                {selectedDayData.expenses.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.description}</p>
                        <span className="text-[10px] text-slate-400">
                          {tx.category?.name || 'Campus'} • {tx.payment_method || 'UPI'}
                        </span>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Transaction
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recording for {formatDate(selectedDate)}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType('expense')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    modalType === 'expense'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('income')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    modalType === 'income'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="e.g. Canteen Lunch, Metro recharge"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {(modalType === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={modalPaymentMethod}
                    onChange={(e) => setModalPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingTransaction || !modalAmount}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {savingTransaction ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>Save to Ledger</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
