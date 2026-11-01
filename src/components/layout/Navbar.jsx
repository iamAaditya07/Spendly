import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Moon,
  Sun,
  PlusCircle,
  GraduationCap,
  Sparkles,
  Wallet,
  Bell
} from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';

export default function Navbar({ onOpenSidebar }) {
  const { currentPage, setCurrentPage, theme, toggleTheme } = useApp();
  const { user, profile } = useAuth();

  // Find active nav item
  const currentNav = NAV_ITEMS.find((item) => item.id === currentPage) || {
    label: currentPage === 'landing' ? 'Campus Finance' : 'Spendly',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {currentNav.label}
              </h1>
              {currentPage === 'pocket-planner' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Wallet className="w-3 h-3" />
                  Live Daily Allowance
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Campus Tagline Badge (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <GraduationCap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Your Money. Your Campus. Your Control.</span>
        </div>

        {/* Right: Quick Add + Theme Toggle + Sign In */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Button */}
          {user && (
            <button
              onClick={() => setCurrentPage('add-transaction')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:shadow-md hover:shadow-brand-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
            </button>
          )}

          {/* Smart Reminders Notification Bell */}
          {user && (
            <button
              onClick={() => setCurrentPage('reminders')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Smart Reminders"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Sign In if not logged in */}
          {!user && currentPage !== 'auth' && (
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
