/**
 * Smart Spending Insights Service (Feature 6)
 * Rule-based analytics engine with AI-ready architecture for campus financial intelligence.
 */

export function generateSpendingInsights(transactions = [], baselinePocketMoney = 8000) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Separate current month vs previous month
  const currentMonthExpenses = [];
  const prevMonthExpenses = [];

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }

  transactions.forEach(t => {
    if (!t.date || t.type !== 'expense') return;
    const [y, m] = t.date.split('-').map(Number);
    if (y === currentYear && (m - 1) === currentMonth) {
      currentMonthExpenses.push(t);
    } else if (y === prevYear && (m - 1) === prevMonth) {
      prevMonthExpenses.push(t);
    }
  });

  const currentTotal = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const prevTotal = prevMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Month on Month change
  const momChangeAmount = currentTotal - prevTotal;
  const momChangePercent = prevTotal > 0
    ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100)
    : 0;

  // Category breakdown for current month
  const catMap = {};
  currentMonthExpenses.forEach(t => {
    const catName = t.category?.name || 'General';
    const catColor = t.category?.color || '#6366f1';
    if (!catMap[catName]) {
      catMap[catName] = { name: catName, total: 0, count: 0, color: catColor };
    }
    catMap[catName].total += t.amount;
    catMap[catName].count += 1;
  });

  const topCategories = Object.values(catMap)
    .map(c => ({
      ...c,
      percentage: currentTotal > 0 ? Math.round((c.total / currentTotal) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

  // Category breakdown for previous month to detect surges
  const prevCatMap = {};
  prevMonthExpenses.forEach(t => {
    const catName = t.category?.name || 'General';
    if (!prevCatMap[catName]) prevCatMap[catName] = 0;
    prevCatMap[catName] += t.amount;
  });

  // Surge Detection (> 30% jump)
  const surges = [];
  topCategories.forEach(cat => {
    const prevCatTotal = prevCatMap[cat.name] || 0;
    if (prevCatTotal > 200 && cat.total > prevCatTotal * 1.3) {
      const surgePercent = Math.round(((cat.total - prevCatTotal) / prevCatTotal) * 100);
      surges.push({
        category: cat.name,
        currentTotal: cat.total,
        prevTotal: prevCatTotal,
        increasePercent: surgePercent
      });
    }
  });

  // Weekend vs Weekday analysis
  let weekdayTotal = 0;
  let weekendTotal = 0;

  currentMonthExpenses.forEach(t => {
    const dateObj = new Date(t.date);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendTotal += t.amount;
    } else {
      weekdayTotal += t.amount;
    }
  });

  const weekendPercentage = currentTotal > 0 ? Math.round((weekendTotal / currentTotal) * 100) : 0;
  const isWeekendSpike = weekendPercentage > 45; // If weekend accounts for >45% of spend

  // Rule-based actionable suggestions
  const suggestions = [];

  // Suggestion 1: Canteen / Dining
  const canteenSpend = topCategories.find(c => c.name.toLowerCase().includes('canteen') || c.name.toLowerCase().includes('food'));
  if (canteenSpend && canteenSpend.percentage >= 35) {
    suggestions.push({
      id: 'tip_food',
      type: 'warning',
      title: 'High Canteen & Takeout Ratio',
      text: `${canteenSpend.name} accounts for ${canteenSpend.percentage}% (₹${canteenSpend.total.toLocaleString('en-IN')}) of your total expenses. Packing hostel snacks or sharing canteen platters could save ~₹1,200/month.`,
      potentialSavings: 1200
    });
  }

  // Suggestion 2: Weekend Spikes
  if (isWeekendSpike) {
    suggestions.push({
      id: 'tip_weekend',
      type: 'caution',
      title: 'Weekend Outing Surge',
      text: `You spend ${weekendPercentage}% of your total budget on Saturdays and Sundays. Setting a strict ₹400 weekend party ceiling will keep you safe before month-end.`,
      potentialSavings: 800
    });
  }

  // Suggestion 3: Allowance Adherence
  if (currentTotal > baselinePocketMoney * 0.8) {
    suggestions.push({
      id: 'tip_budget',
      type: 'critical',
      title: 'Approaching Monthly Pocket Money Limit',
      text: `You have consumed over 80% of your student pocket money baseline. Prioritize essential hostel groceries over social events for the remaining days.`,
      potentialSavings: 600
    });
  } else {
    suggestions.push({
      id: 'tip_savings',
      type: 'success',
      title: 'Healthy Savings Velocity',
      text: `Great financial control! You are on pace to retain an estimated ₹${Math.max(0, baselinePocketMoney - currentTotal).toLocaleString('en-IN')} by month-end. Consider depositing this into your Savings Goals!`,
      potentialSavings: Math.max(0, baselinePocketMoney - currentTotal)
    });
  }

  return {
    currentTotal,
    prevTotal,
    momChangeAmount,
    momChangePercent,
    topCategories,
    surges,
    weekdayTotal,
    weekendTotal,
    weekendPercentage,
    isWeekendSpike,
    suggestions,
    transactionCount: currentMonthExpenses.length
  };
}

/**
 * AI Integration Architecture:
 * Formats a clean context payload ready to be sent to Gemini or any LLM API.
 */
export function getAIPromptContext(insights, profile) {
  return {
    studentProfile: {
      college: profile?.college_name || 'Campus University',
      monthlyAllowance: profile?.monthly_pocket_money || 8000,
    },
    spendingSummary: {
      totalSpentThisMonth: insights.currentTotal,
      topCategories: insights.topCategories.map(c => `${c.name}: ₹${c.total} (${c.percentage}%)`),
      weekendSpendRatio: `${insights.weekendPercentage}% of total`,
      surgesDetected: insights.surges.map(s => `${s.category} spiked +${s.increasePercent}%`),
    },
    request: "Act as Spendly's campus financial mentor. Provide 3 sharp, student-friendly tips to optimize pocket money."
  };
}
