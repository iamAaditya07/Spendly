import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { updateProfile } from '../services/profileService';
import { User, School, Wallet, Moon, Sun, Save, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, fetchUserProfile, signOut } = useAuth();
  const { theme, toggleTheme, showToast, setCurrentPage } = useApp();

  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [pocketMoney, setPocketMoney] = useState('8000');
  const [studentId, setStudentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCollegeName(profile.college_name || '');
      setPocketMoney((profile.monthly_pocket_money || 8000).toString());
      setStudentId(profile.student_id || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setCollegeName(user.user_metadata?.college_name || '');
      setPocketMoney((user.user_metadata?.monthly_pocket_money || 8000).toString());
      setStudentId(user.user_metadata?.student_id || '');
    }
  }, [profile, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to save profile settings', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        fullName,
        collegeName,
        studentId,
        monthlyPocketMoney: parseFloat(pocketMoney) || 8000
      });
      await fetchUserProfile(user.id);
      showToast('Profile & Pocket Money baseline saved to database!');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    showToast('Signed out of campus session');
    setCurrentPage('landing');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Profile & Campus Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your student profile, monthly pocket money baseline, and display preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College / University
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. IIT Delhi, BITS Pilani"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Pocket Money Baseline (₹)
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={pocketMoney}
                  onChange={(e) => setPocketMoney(e.target.value)}
                  step="100"
                  min="500"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to compute your daily recommended spending ceiling.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student ID / Roll No (Optional)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 2024CS0192"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme:</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>{theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {user && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Signed in as <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong></span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
