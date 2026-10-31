// Formatters and Calculation Utilities for Spendly

/**
 * Format numeric value to Indian Rupees or given currency symbol
 * Example: formatCurrency(12500) -> "₹12,500.00"
 */
export function formatCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format compact currency for charts and badge counters
 * Example: formatCompactCurrency(15000) -> "₹15k"
 */
export function formatCompactCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `${currency}${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${currency}${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${currency}${(num / 1000).toFixed(1)}k`;
  return `${currency}${num.toFixed(0)}`;
}

/**
 * Format standard date (YYYY-MM-DD) into readable campus date
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get remaining days in current calendar month
 */
export function getRemainingDaysInMonth() {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(1, totalDays - currentDay + 1);
}

/**
 * Calculate recommended daily allowance based on pocket money, spending, and remaining days
 */
export function calculateDailyAllowance(pocketMoney, totalSpent) {
  const remainingMoney = Math.max(0, (Number(pocketMoney) || 0) - (Number(totalSpent) || 0));
  const remainingDays = getRemainingDaysInMonth();
  return remainingMoney / remainingDays;
}
