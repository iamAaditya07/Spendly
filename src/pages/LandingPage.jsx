import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Wallet,
  Users,
  Target,
  CalendarClock,
  Flame,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';

export default function LandingPage() {
  const { setCurrentPage, theme, toggleTheme } = useApp();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Marketing Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-campus-cyan flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-brand-600 dark:from-white dark:via-brand-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Spendly
            </span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Campus Edition
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {user ? (
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Student Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Tagline: Your Money. Your Campus. Your Control.</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.12]">
            Take full command of your{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-campus-cyan bg-clip-text text-transparent">
              student pocket money
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The intelligent campus expense platform tailored for college life: calculate daily allowances, split canteen & hostel bills with roommates, crush savings goals, and monitor student subscriptions.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(user ? 'dashboard' : 'auth')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-xl shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Get Started with Spendly</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-base text-slate-800 dark:text-slate-200 shadow-sm transition-all"
            >
              <span>Explore Live Dashboard</span>
            </button>
          </div>

          {/* Live Fintech Interactive Preview Card */}
          <div className="mt-16 max-w-4xl mx-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    October Campus Budget
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Hostel & Daily Living
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Daily Safe Limit: ₹280/day
                </span>
              </div>
            </div>

            {/* Quick Metrics Demo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Pocket Money
                </span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹8,500</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Spent So Far
                </span>
                <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">₹4,260</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Remaining
                </span>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹4,240</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900">
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Streak
                </span>
                <p className="text-xl font-extrabold text-brand-700 dark:text-brand-300 mt-1">5 Days 🔥</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Special Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-3">
              Engineered for Campus Life
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Six Special Modules Designed for Students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                1. Smart Pocket Money Planner
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log monthly pocket money or stipend. Spendly computes your daily safe spending ceiling across the remaining days of the month with real-time warning thresholds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                2. Split Expenses with Friends
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Create groups with flatmates or campus project teams. Split equal or custom shares, track who owes whom, and record instant UPI settlements.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                3. Savings Goals & Milestones
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Save for a new laptop, college fest trip, or certification exams. Track progress bars, add money progressively, and celebrate completions with confetti!
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CalendarClock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                4. Subscription Tracker
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Never get surprised by auto-renewals. Track Netflix, Spotify Student, Gym, and coding subscriptions with renewal countdowns and monthly totals.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                5. No-Spend Challenge
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Build financial discipline with gamified 7-day or 30-day challenges. Earn badges, maintain hot streaks, and calculate cumulative money saved.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                6. Smart Spending Insights
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Rule-based intelligence that analyzes canteen trends, flags unusual weekly surges, compares month-on-month expenses, and offers personalized tips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Spendly — Your Money. Your Campus. Your Control.
        </p>
        <p className="mt-1">
          Built for students across colleges and universities.
        </p>
      </footer>
    </div>
  );
}
