import { fetchTransactions, createTransaction } from './transactionsService';
import { fetchSubscriptions } from './subscriptionService';

/**
 * Calendar Service (Feature 10)
 * Aggregates transactions and subscription obligations by calendar day and week.
 */

export function getDaysInMonth(year, month) {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year, month) {
  // 0 = Sunday, 1 = Monday, etc.
  return new Date(year, month, 1).getDay();
}

/**
 * Builds a structured calendar grid with daily financial aggregations
 */
export async function getMonthCalendarData(userId, year, month) {
  const [transactions, subscriptions] = await Promise.all([
    fetchTransactions(userId).catch(() => []),
    fetchSubscriptions(userId).catch(() => [])
  ]);

  const daysCount = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Group transactions by date string 'YYYY-MM-DD'
  const pad = (n) => String(n).padStart(2, '0');
  const monthStr = pad(month + 1);
  const prefix = `${year}-${monthStr}-`;

  const dailyMap = {};
  for (let d = 1; d <= daysCount; d++) {
    const dateKey = `${prefix}${pad(d)}`;
    dailyMap[dateKey] = {
      day: d,
      date: dateKey,
      expenses: [],
      incomes: [],
      totalExpense: 0,
      totalIncome: 0,
      subscriptionsDue: []
    };
  }

  // Populate transactions
  transactions.forEach((tx) => {
    if (!tx.date || !tx.date.startsWith(prefix)) return;
    const entry = dailyMap[tx.date];
    if (entry) {
      const amt = parseFloat(tx.amount || 0);
      if (tx.type === 'income') {
        entry.incomes.push(tx);
        entry.totalIncome += amt;
      } else {
        entry.expenses.push(tx);
        entry.totalExpense += amt;
      }
    }
  });

  // Populate upcoming or recurring subscription renewals
  subscriptions.forEach((sub) => {
    if (sub.is_paused) return;
    if (sub.next_payment_date && sub.next_payment_date.startsWith(prefix)) {
      const entry = dailyMap[sub.next_payment_date];
      if (entry) {
        entry.subscriptionsDue.push(sub);
      }
    }
  });

  // Calculate monthly totals
  let totalMonthExpense = 0;
  let totalMonthIncome = 0;
  let activeSpendDays = 0;

  // Calculate weekly breakdown (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29+)
  const weeklyTotals = [
    { week: 'Week 1 (1-7)', total: 0 },
    { week: 'Week 2 (8-14)', total: 0 },
    { week: 'Week 3 (15-21)', total: 0 },
    { week: 'Week 4 (22-28)', total: 0 },
    { week: 'Week 5 (29-31)', total: 0 }
  ];

  Object.values(dailyMap).forEach((dayData) => {
    totalMonthExpense += dayData.totalExpense;
    totalMonthIncome += dayData.totalIncome;
    if (dayData.totalExpense > 0) activeSpendDays++;

    const d = dayData.day;
    if (d <= 7) weeklyTotals[0].total += dayData.totalExpense;
    else if (d <= 14) weeklyTotals[1].total += dayData.totalExpense;
    else if (d <= 21) weeklyTotals[2].total += dayData.totalExpense;
    else if (d <= 28) weeklyTotals[3].total += dayData.totalExpense;
    else weeklyTotals[4].total += dayData.totalExpense;
  });

  return {
    year,
    month,
    daysCount,
    firstDay,
    dailyMap,
    totalMonthExpense,
    totalMonthIncome,
    netBalance: totalMonthIncome - totalMonthExpense,
    activeSpendDays,
    weeklyTotals
  };
}

/**
 * Quick-add transaction directly from calendar date
 */
export async function addTransactionFromCalendar({
  userId,
  date,
  description,
  amount,
  type = 'expense',
  categoryId = 'canteen',
  paymentMethod = 'UPI'
}) {
  return createTransaction({
    userId,
    date,
    description: description.trim(),
    amount: parseFloat(amount),
    type,
    categoryId,
    paymentMethod,
    notes: 'Added via Expense Calendar'
  });
}
