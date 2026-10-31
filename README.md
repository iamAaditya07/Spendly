# Spendly — Campus Expense & Financial Management Platform
> **Tagline:** *Your Money. Your Campus. Your Control.*

Spendly is a fintech web application engineered for college students, hostelites, and campus roommates. It combines pocket money budgeting, group bill splitting, milestone savings goals, subscription monitoring, gamified no-spend challenges, and AI-ready smart spending insights into a unified SaaS experience.

---

## 🌟 The Six Special Modules

### 1. 👛 Smart Pocket Money Planner
- Enter your monthly pocket money baseline or stipend (in ₹).
- Calculates remaining money live.
- Computes your **Daily Safe Spending Limit** based on the remaining days in the month (`Remaining / Remaining Days`).
- Dynamic warning alerts (`Safe Pacing` ➔ `Caution Warning` at 70% ➔ `Critical Alert` at 85%+).
- **"What-If" Purchase Simulator**: Drag the slider to test how an unplanned campus purchase today affects your daily allowance for the rest of the month.

### 2. 👥 Expense Splitting with Friends & Roommates
- Create groups for **Flat Roommates**, **College Trips**, **Canteen Gangs**, or **Hackathon Teams**.
- Add friend pills dynamically.
- Record shared bills with **Equal Split** or **Custom Amounts** per member.
- Real-time **Net Position Overview**: *"You Are Owed (Credits)"* vs *"You Owe (Debts)"*.
- Built-in **Debt Simplification Algorithm** that computes who pays whom with zero awkward group math.
- **1-Click Settlement (Record UPI)**: Settle debts with GPay/PhonePe payment reference tags.

### 3. 🎯 Student Savings Goals
- Save for high-value student assets: **Coding Laptops**, **Smartphones**, **Goa Campus Trips**, **Textbooks**, or **Emergency Funds**.
- Visual progress bars and percentage completed.
- Recommended monthly savings rate needed to reach your target by the deadline.
- **Deposit Money Modal**: Incrementally deposit savings with quick buttons (`+₹500`, `+₹1000`, `+₹2000`, `+₹5000`).
- **🎉 Confetti Celebration**: Triggers celebration confetti across your screen when a goal reaches 100%!

### 4. ⏰ Campus Subscription Tracker
- Monitor student OTT plans, Spotify Student, Gym memberships, Claude Pro, and GitHub Copilot.
- **Normalized Monthly Expenditure**: Converts weekly (× 4.33) and yearly (÷ 12) billing into a unified monthly expenditure figure.
- **Upcoming Renewal Alerts**: Highlights renewals due within the next 7 days in amber.
- Pause and resume subscriptions during semester exams without losing data.

### 5. 🔥 No-Spend Challenge & Streaks
- Gamify your financial discipline with **3-Day Weekend**, **7-Day Sprint**, and **30-Day Marathon** challenges.
- **Streak Flame Counter**: Displays your active daily streak 🔥.
- **Milestone Badges**: Unlock *First Step*, *Weekend Warrior*, *7-Day Iron Will*, *Frugal Master*, and *Centurion Legend*.
- Computes estimated total money saved based on your campus daily average.

### 6. 🧠 Smart Spending Insights (AI-Ready Architecture)
- **Rule-Based Financial Intelligence**:
  - Top 3 spending categories breakdown.
  - **Month-on-Month Comparison**: Compares current month vs previous month expenses with % change.
  - **Surge & Anomaly Alerts**: Flags categories that spiked > 30% compared to previous period.
  - **Weekday vs Weekend Spending Ratio**: Identifies whether you have a weekend hangout spending bias.
  - Actionable student savings suggestions.
- **AI-Ready Schema**: Ready-to-go structured JSON prompt context for integration with Gemini API or any LLM.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6 |
| **Styling** | Tailwind CSS (Dark & Light themes, Custom Scrollbars) |
| **Charts** | Recharts (Responsive Pie/Donut & Bar charts) |
| **Icons** | Lucide React |
| **Celebrations** | Canvas Confetti |
| **Backend & API** | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Installation
```bash
# Clone the repository and navigate into it
cd project

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
```

### 4. Database Setup
1. Open your Supabase Dashboard: **SQL Editor** -> **New Query**.
2. Copy and paste the entire script from [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. This creates all 14 tables, Row Level Security policies, and the automatic profile signup trigger.
4. *(Optional for instant development signups)*: In Supabase -> **Authentication** -> **Providers** -> **Email** -> Toggle **OFF** "Confirm email" -> **Save**.

### 5. Run the Local Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🚢 Deployment to Vercel

1. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial Spendly Campus Release"
   git branch -M main
   git remote add origin https://github.com/your-username/spendly.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Add your Environment Variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will build and host your application with global CDN caching.

---

## 📄 License
MIT License. Built for students across university and college campuses.
