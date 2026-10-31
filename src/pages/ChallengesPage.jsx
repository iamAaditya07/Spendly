import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  fetchChallenges,
  createChallenge,
  recordDailyCheckin,
  calculateChallengeStats
} from '../services/challengeService';
import { formatCurrency, formatDate } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Flame,
  PlusCircle,
  Sparkles,
  Award,
  Crown,
  Shield,
  Footprints,
  CheckCircle2,
  Calendar,
  X,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function ChallengesPage() {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('7');
  const [targetSavings, setTargetSavings] = useState('1800');

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = await fetchChallenges(user?.id);
      setChallenges(data);
    } catch (err) {
      console.error('Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateChallengeStats(challenges);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Create Challenge
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createChallenge({
        userId: user?.id,
        title,
        challengeType: parseInt(duration) <= 3 ? 'daily' : parseInt(duration) <= 7 ? 'weekly' : 'monthly',
        durationDays: parseInt(duration),
        targetSavings: parseFloat(targetSavings) || 1500
      });

      await loadChallenges();
      setShowCreateModal(false);
      setTitle('');
      showToast(`Challenge "${title}" started! Stay disciplined! 🔥`);
    } catch (err) {
      console.error('Create challenge error:', err);
      showToast('Failed to create challenge', 'error');
    }
  };

  // Record Check-in for today
  const handleCheckin = async (challenge) => {
    try {
      await recordDailyCheckin({
        challengeId: challenge.id,
        userId: user?.id,
        savedAmount: 250
      });

      await loadChallenges();
      triggerConfetti();
      showToast('🔥 Check-in logged! Streak updated & ₹250 saved!');
    } catch (err) {
      console.error('Check-in error:', err);
      showToast('Failed to record check-in', 'error');
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 5: No-Spend Challenge</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            No-Spend Streak & Achievements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Gamify your financial discipline: maintain hot streaks, earn campus badges, and compute total money saved.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Challenge</span>
        </button>
      </div>

      {/* Hero Streak & Stats Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white shadow-xl shadow-rose-500/15 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-3xl shadow-inner">
            🔥
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Active Streak
            </span>
            <p className="text-4xl font-extrabold tracking-tight">
              {stats.currentStreak} Days
            </p>
            <p className="text-xs text-rose-100/90 mt-1">
              Consecutive days without non-essential spending
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[140px]">
            <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">
              Estimated Saved
            </span>
            <p className="text-2xl font-extrabold mt-0.5">
              {formatCurrency(stats.totalSaved)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[140px]">
            <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">
              No-Spend Days
            </span>
            <p className="text-2xl font-extrabold mt-0.5">
              {stats.totalSuccessfulDays} Days
            </p>
          </div>
        </div>
      </div>

      {/* Milestone Badges Showcase */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Milestone Badges & Trophies
            </h3>
            <p className="text-xs text-slate-400">Unlock campus achievements as your savings streak increases</p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats.badges.map(badge => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border text-center transition-all ${
                badge.isUnlocked
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 font-bold ${
                  badge.isUnlocked
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {badge.id === 'badge_1' ? <Footprints className="w-6 h-6" /> :
                 badge.id === 'badge_3' ? <Shield className="w-6 h-6" /> :
                 badge.id === 'badge_7' ? <Flame className="w-6 h-6" /> :
                 badge.id === 'badge_14' ? <Award className="w-6 h-6" /> :
                 <Crown className="w-6 h-6" />}
              </div>

              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {badge.title}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                {badge.desc}
              </p>

              {badge.isUnlocked ? (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Unlocked ✓
                </span>
              ) : (
                <span className="inline-block mt-2 text-[10px] font-bold text-slate-400">
                  {badge.minStreak} days req.
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Challenges List */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Active Savings Challenges
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(chal => {
            const checkins = chal.checkins || [];
            const hasCheckedInToday = checkins.some(c => c.date === todayIso);
            const totalDuration = chal.challenge_type === 'daily' ? 3 : chal.challenge_type === 'weekly' ? 7 : 30;
            const progressPercent = Math.min(100, Math.round((checkins.length / totalDuration) * 100));

            return (
              <div
                key={chal.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {chal.challenge_type} Challenge
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {chal.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target Savings: {formatCurrency(chal.target_savings)}
                    </p>
                  </div>

                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    🔥 {chal.streak || checkins.length} Days
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Progress ({checkins.length}/{totalDuration} days)</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action: Check in for today */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {hasCheckedInToday ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Today's No-Spend Day Recorded!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckin(chal)}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Flame className="w-4 h-4 text-amber-300" />
                      <span>Check-in: Today was a No-Spend Day</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Start New Challenge */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Start a No-Spend Challenge
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 7-Day Canteen Fast, Zero-Spend Weekend"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: '3', label: '3-Day Weekend' },
                    { days: '7', label: '7-Day Sprint' },
                    { days: '30', label: '30-Day Month' }
                  ].map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => {
                        setDuration(opt.days);
                        setTargetSavings(opt.days === '3' ? '800' : opt.days === '7' ? '1800' : '7500');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        duration === opt.days
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Savings (₹)
                </label>
                <input
                  type="number"
                  step="100"
                  min="200"
                  value={targetSavings}
                  onChange={(e) => setTargetSavings(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Start Challenge 🔥
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
