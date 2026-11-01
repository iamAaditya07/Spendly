import { supabase } from '../lib/supabase';
import { fetchTransactions } from './transactionsService';
import { fetchSavingsGoals } from './savingsService';
import { fetchSubscriptions } from './subscriptionService';
import { getProfile } from './profileService';
import { generateSpendingInsights } from './insightsService';
import { formatCurrency, getRemainingDaysInMonth } from '../utils/formatters';

const DEMO_CHAT_KEY = 'spendly_demo_chat_history';

/**
 * Pre-seeded welcome message
 */
export const DEFAULT_WELCOME_MESSAGE = {
  id: 'msg_welcome',
  role: 'assistant',
  content: `👋 Hi! I am **Finora**, your personal campus financial mentor.

I have direct access to your authenticated transaction records, pocket money planner, and savings goals.

Here are a few questions you can ask me right now:
* *"How much did I spend this month?"*
* *"Where did most of my money go?"*
* *"Can I afford a laptop worth ₹50,000?"*
* *"Why am I spending more than last month?"*
* *"How much should I save every month?"*

How can I help you take control of your campus budget today?`,
  created_at: new Date().toISOString()
};

function getLocalChatHistory() {
  const data = localStorage.getItem(DEMO_CHAT_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }
  return [DEFAULT_WELCOME_MESSAGE];
}

function saveLocalChatHistory(history) {
  localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(history));
}

/**
 * Extracts and prepares complete financial context grounded in real user data
 */
export async function getUserFinancialContext(userId) {
  const [profile, transactions, goals, subscriptions] = await Promise.all([
    getProfile(userId).catch(() => ({ monthly_pocket_money: 8000, college_name: 'Campus' })),
    fetchTransactions(userId).catch(() => []),
    fetchSavingsGoals(userId).catch(() => []),
    fetchSubscriptions(userId).catch(() => [])
  ]);

  const pocketMoney = parseFloat(profile?.monthly_pocket_money || 8000);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month transactions
  const currentMonthTx = transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const effectiveIncome = Math.max(pocketMoney, totalIncome);
  const availableBalance = Math.max(0, effectiveIncome - totalSpent);
  const remainingDays = getRemainingDaysInMonth();
  const dailyAllowance = Math.round(availableBalance / remainingDays);

  const insights = generateSpendingInsights(transactions, pocketMoney);

  // Subscriptions monthly total
  const activeSubs = subscriptions.filter((s) => !s.is_paused);
  const monthlySubTotal = activeSubs.reduce((sum, s) => {
    const amt = parseFloat(s.amount || 0);
    if (s.billing_frequency === 'yearly') return sum + amt / 12;
    if (s.billing_frequency === 'weekly') return sum + amt * 4.33;
    return sum + amt;
  }, 0);

  return {
    profile,
    pocketMoney,
    totalSpent,
    totalIncome,
    effectiveIncome,
    availableBalance,
    remainingDays,
    dailyAllowance,
    topCategories: insights.topCategories || [],
    momChangeAmount: insights.momChangeAmount || 0,
    momChangePercent: insights.momChangePercent || 0,
    prevTotal: insights.prevTotal || 0,
    surges: insights.surges || [],
    weekendPercentage: insights.weekendPercentage || 0,
    goals,
    subscriptions: activeSubs,
    monthlySubTotal,
    transactionCount: currentMonthTx.length
  };
}

/**
 * Intelligent deterministic response engine grounded in real database figures
 */
export function generateDeterministicResponse(query, ctx) {
  const q = query.toLowerCase().trim();

  // 1. "Can I afford [item] worth ₹[amount]?"
  const affordRegex = /(?:can\s+i\s+afford|afford|should\s+i\s+buy|buy)\s+(?:a\s+|an\s+)?([a-zA-Z\s]+)?(?:worth\s+|for\s+|of\s+)?(?:₹|rs\.?|inr)?\s*([0-9,]+)/i;
  const affordMatch = query.match(affordRegex);

  if (affordMatch) {
    const rawAmt = affordMatch[2].replace(/,/g, '');
    const targetPrice = parseFloat(rawAmt);
    const itemName = affordMatch[1]?.trim() || 'this item';

    if (!isNaN(targetPrice) && targetPrice > 0) {
      const remainingAfter = ctx.availableBalance - targetPrice;
      const newDailyAllowance = Math.round(remainingAfter / ctx.remainingDays);

      if (targetPrice > ctx.availableBalance) {
        const shortfall = targetPrice - ctx.availableBalance;
        return `### 🛑 Affordability Verdict: **Not Recommended Right Now**

* **Item:** ${itemName} (${formatCurrency(targetPrice)})
* **Your Current Available Balance:** ${formatCurrency(ctx.availableBalance)}
* **Shortfall:** You are short by **${formatCurrency(shortfall)}**.

Buying this today would push your student account into a deficit of ${formatCurrency(Math.abs(remainingAfter))}.

💡 **Recommended Action:**
1. Do not use emergency pocket money for this purchase.
2. Go to **Savings Goals** and create a dedicated goal for *"${itemName}"*.
3. If you save **${formatCurrency(Math.ceil(targetPrice / 3))}/month**, you can afford it in **3 months** without stressing your daily campus meals!`;
      } else if (newDailyAllowance < 150) {
        return `### ⚠️ Affordability Verdict: **Caution - High Risk**

* **Item:** ${itemName} (${formatCurrency(targetPrice)})
* **Available Balance:** ${formatCurrency(ctx.availableBalance)}
* **Balance Remaining After Purchase:** ${formatCurrency(remainingAfter)}

While you technically have enough money, purchasing this would reduce your daily safe spending allowance from **${formatCurrency(ctx.dailyAllowance)}/day** down to **${formatCurrency(newDailyAllowance)}/day** for the remaining **${ctx.remainingDays} days** of this month.

💡 **Student Tip:** Unless this is an urgent academic requirement (e.g. required semester exam book or lab hardware), consider waiting until next month's pocket money arrives.`;
      } else {
        return `### ✅ Affordability Verdict: **Safe to Purchase!**

* **Item:** ${itemName} (${formatCurrency(targetPrice)})
* **Available Balance:** ${formatCurrency(ctx.availableBalance)}
* **Remaining Buffer After Purchase:** ${formatCurrency(remainingAfter)}
* **New Daily Safe Allowance:** **${formatCurrency(newDailyAllowance)}/day** for the next **${ctx.remainingDays} days**.

Even after spending ${formatCurrency(targetPrice)}, your daily allowance stays well above safe campus baseline.

📌 *Pro-Tip: Log this purchase in the Add Entry page right after paying to keep your ledger accurate!*`;
      }
    }
  }

  // 2. "How much did I spend this month?"
  if (q.includes('how much') && (q.includes('spend') || q.includes('spent') || q.includes('expense'))) {
    const percentUsed = Math.round((ctx.totalSpent / ctx.effectiveIncome) * 100);
    return `### 📊 Monthly Spending Breakdown

* **Total Spent This Month:** **${formatCurrency(ctx.totalSpent)}**
* **Monthly Pocket Money Baseline:** ${formatCurrency(ctx.pocketMoney)}
* **Budget Used:** **${percentUsed}%**
* **Available Balance Left:** **${formatCurrency(ctx.availableBalance)}**
* **Recommended Daily Limit:** **${formatCurrency(ctx.dailyAllowance)}/day** (${ctx.remainingDays} days remaining)

${percentUsed > 85
  ? '⚠️ *Alert:* You have utilized over 85% of your monthly allowance. Stick strictly to your daily limit of ' + formatCurrency(ctx.dailyAllowance) + ' to finish the month safely.'
  : '✅ *Pacing:* Your spending is currently on track. Keep this momentum to save a surplus by month-end!'}`;
  }

  // 3. "Where did most of my money go?" / Top Categories
  if (q.includes('where') || q.includes('category') || q.includes('categories') || q.includes('most of my money')) {
    if (ctx.topCategories.length === 0) {
      return `You haven't logged any expenses yet this month! Add your recent canteen slips or metro fares to see where your money goes.`;
    }

    const topList = ctx.topCategories
      .slice(0, 4)
      .map((c, i) => `${i + 1}. **${c.name}**: ${formatCurrency(c.total)} (${c.percentage}% of total expenses)`)
      .join('\n');

    const top1 = ctx.topCategories[0];
    return `### 🏷️ Top Spending Categories This Month

Here is where your campus money went:

${topList}

💡 **Insight:** Your #1 expense category is **${top1.name}** at **${top1.percentage}%** of your total outlays. ${
      top1.name.toLowerCase().includes('canteen') || top1.name.toLowerCase().includes('food')
        ? 'Consider utilizing the campus mess or cooking simple meals with roommates to lower food delivery costs.'
        : 'Review your recent entries to see if any one-off purchases can be optimized.'
    }`;
  }

  // 4. "Why am I spending more than last month?" / MoM comparison
  if (q.includes('more than last month') || q.includes('compare') || q.includes('previous month') || q.includes('last month')) {
    const diff = ctx.momChangeAmount;
    const pct = ctx.momChangePercent;

    if (pct > 0) {
      const surgeLines = ctx.surges.length > 0
        ? ctx.surges.map(s => `* **${s.category}:** jumped +${s.increasePercent}% (${formatCurrency(s.prevTotal)} ➔ ${formatCurrency(s.currentTotal)})`).join('\n')
        : '* Overall spending increased across daily dining and miscellaneous items.';

      return `### 📈 Month-over-Month Comparison

You have spent **${formatCurrency(diff)} (+${pct}%) more** this month compared to last month:

* **This Month:** ${formatCurrency(ctx.totalSpent)}
* **Last Month:** ${formatCurrency(ctx.prevTotal)}

**Detected Category Surges:**
${surgeLines}

${ctx.weekendPercentage > 45 ? `⚠️ **Weekend Factor:** ${ctx.weekendPercentage}% of your expenses occurred on Saturday/Sunday. Weekend outings and Swiggy orders are driving the increase.` : ''}

💡 **Recommended Action:** Try joining the **No-Spend Challenge** for the upcoming weekend to reset your spending pace!`;
    } else {
      return `### 📉 Month-over-Month Comparison

Good news! You have actually spent **${formatCurrency(Math.abs(diff))} (${Math.abs(pct)}%) LESS** than this time last month:

* **This Month:** ${formatCurrency(ctx.totalSpent)}
* **Last Month:** ${formatCurrency(ctx.prevTotal)}

You are pacing very well. If you maintain this discipline, you will retain **${formatCurrency(ctx.availableBalance)}** as a surplus at month-end!`;
    }
  }

  // 5. "How much should I save every month?" / Savings Guidance
  if (q.includes('how much should i save') || q.includes('save every month') || q.includes('savings goal') || q.includes('plan savings')) {
    const recommended20 = Math.round(ctx.effectiveIncome * 0.20);
    const recommended10 = Math.round(ctx.effectiveIncome * 0.10);

    const goalStatus = ctx.goals.length > 0
      ? `You currently have **${ctx.goals.length} active savings goal(s)**:
${ctx.goals.map(g => `* **${g.title}:** ${formatCurrency(g.current_amount || 0)} / ${formatCurrency(g.target_amount)} (${Math.round(((g.current_amount || 0) / g.target_amount) * 100)}%)`).join('\n')}`
      : `You do not have any active savings goals yet. Saving without a goal often leads to impulsive spending!`;

    return `### 🎯 Recommended Student Savings Blueprint

For student life and hostel budgeting, we recommend the **70/20/10 Rule**:

1. **70% Campus Essentials (${formatCurrency(Math.round(ctx.effectiveIncome * 0.70))}):** Canteen, hostel rent, transport, textbooks.
2. **20% Milestone Savings (${formatCurrency(recommended20)}):** Put this towards laptops, trips, or emergency cushion.
3. **10% Guilt-Free Fun (${formatCurrency(recommended10)}):** Weekend movies, campus fests, cafe outings.

**Your Current Goals:**
${goalStatus}

💡 **Action Step:** Start small by setting aside just **${formatCurrency(recommended10)}/month**. That compounds to **${formatCurrency(recommended10 * 12)}/year**!`;
  }

  // 6. Subscriptions queries
  if (q.includes('subscription') || q.includes('recurring') || q.includes('ott') || q.includes('netflix')) {
    if (ctx.subscriptions.length === 0) {
      return `You have **no active subscriptions** recorded. You have 0 recurring digital overhead—that gives you maximum cashflow freedom!`;
    }

    const subList = ctx.subscriptions.map(s => `* **${s.name}:** ${formatCurrency(s.amount)} (${s.billing_frequency})`).join('\n');
    return `### 📺 Recurring Subscriptions Overview

* **Active Subscriptions (${ctx.subscriptions.length}):**
${subList}
* **Total Monthly Commitment:** **${formatCurrency(ctx.monthlySubTotal)}/month**

💡 **Student Hack:** Check if you can share family plans with roommates (e.g. Spotify Family or Netflix 4-screen), or switch to Student Discount plans to save up to 50%!`;
  }

  // 7. Daily allowance / pocket money limit
  if (q.includes('daily') || q.includes('allowance') || q.includes('today')) {
    return `### 👛 Your Daily Spending Allowance

* **Recommended Daily Limit:** **${formatCurrency(ctx.dailyAllowance)}/day**
* **Remaining Safe Days:** ${ctx.remainingDays} days
* **Available Balance:** ${formatCurrency(ctx.availableBalance)}

If you spend less than **${formatCurrency(ctx.dailyAllowance)}** today, your daily limit for the rest of the month will automatically increase tomorrow!`;
  }

  // Generic fallback with real financial data grounding
  return `### 💡 Campus Financial Summary for Today

Here is a quick overview of your current student finances:

* **Monthly Pocket Money:** ${formatCurrency(ctx.pocketMoney)}
* **Total Spent:** ${formatCurrency(ctx.totalSpent)}
* **Available Balance:** ${formatCurrency(ctx.availableBalance)}
* **Safe Daily Limit:** **${formatCurrency(ctx.dailyAllowance)}/day** (${ctx.remainingDays} days left)
* **Top Spending Category:** ${ctx.topCategories[0]?.name || 'None yet'} (${ctx.topCategories[0]?.percentage || 0}%)

You can ask me specific questions like:
* *"Can I afford dinner at BBQ Nation for ₹1,200?"*
* *"Where did most of my money go?"*
* *"How much should I save every month?"*`;
}

/**
 * Main query entry point: Connects to Gemini API if available,
 * or gracefully defaults to the accurate deterministic local engine.
 */
export async function askFinoraAI(userId, question, chatHistory = []) {
  const financialData = await getUserFinancialContext(userId);
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // If Gemini API Key is provided, use Google Gemini with strict grounding
  if (geminiKey && geminiKey.trim().length > 10) {
    try {
      const systemInstruction = `You are Finora, an AI financial mentor for university students and hostelites inside Spendly.
Always ground your answers strictly in the user's authentic database records below. Never invent transactions or figures.
Use Indian Rupees (₹) as the currency. Keep answers concise, empowering, and actionable for college students.

USER'S LIVE FINANCIAL DATA:
- College / Campus: ${financialData.profile.college_name || 'Campus'}
- Monthly Pocket Money Baseline: ₹${financialData.pocketMoney}
- Current Month Total Spent: ₹${financialData.totalSpent}
- Current Month Income: ₹${financialData.totalIncome}
- Available Remaining Balance: ₹${financialData.availableBalance}
- Days Remaining in Month: ${financialData.remainingDays}
- Recommended Daily Allowance: ₹${financialData.dailyAllowance}/day
- Top Spending Categories: ${JSON.stringify(financialData.topCategories)}
- Previous Month Total: ₹${financialData.prevTotal} (Change: ${financialData.momChangePercent}%)
- Active Subscriptions Total: ₹${financialData.monthlySubTotal}/month
- Active Savings Goals: ${JSON.stringify(financialData.goals.map(g => ({ title: g.title, target: g.target_amount, current: g.current_amount })))}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nSTUDENT QUESTION: ${question}` }]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return {
            content: aiText,
            isAIModel: true,
            modelName: 'Gemini 1.5 Flash'
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to local engine:', e);
    }
  }

  // Deterministic local engine fallback (100% reliable, zero latency)
  const localAnswer = generateDeterministicResponse(question, financialData);
  return {
    content: localAnswer,
    isAIModel: false,
    modelName: 'Finora Financial Rule Engine'
  };
}

/**
 * Chat history database persistence
 */
export async function fetchUserChatHistory(userId) {
  if (!userId || userId.startsWith('00000000')) {
    return getLocalChatHistory();
  }

  try {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return getLocalChatHistory();
    }
    return data;
  } catch (err) {
    console.warn('Falling back to local demo chat:', err.message);
    return getLocalChatHistory();
  }
}

export async function saveUserChatMessage(userId, role, content, metadata = {}) {
  const isDemo = userId?.startsWith('00000000');
  const msgObj = {
    id: 'msg_' + Date.now(),
    user_id: userId,
    role,
    content,
    metadata,
    created_at: new Date().toISOString()
  };

  if (isDemo) {
    const history = getLocalChatHistory();
    history.push(msgObj);
    saveLocalChatHistory(history);
  } else {
    try {
      await supabase.from('ai_chat_history').insert([{
        user_id: userId,
        role,
        content,
        metadata
      }]);
    } catch (err) {
      console.warn('Could not save message to Supabase:', err.message);
    }
  }

  return msgObj;
}

export async function clearUserChatHistory(userId) {
  const isDemo = userId?.startsWith('00000000');
  if (isDemo) {
    saveLocalChatHistory([DEFAULT_WELCOME_MESSAGE]);
  } else {
    try {
      await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed clearing chat:', err.message);
    }
  }
}
