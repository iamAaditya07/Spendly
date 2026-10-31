import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  fetchUserGroups,
  createExpenseGroup,
  addSharedGroupExpense,
  recordGroupSettlement,
  calculateGroupBalances
} from '../services/splitService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Users,
  PlusCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  UserCheck,
  Send,
  X,
  UserPlus
} from 'lucide-react';

export default function SplitExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleDebt, setSettleDebt] = useState(null);

  // Create Group Form (Empty defaults, zero dummy data)
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState('roommates');
  const [memberInput, setMemberInput] = useState('');
  const [newMembersList, setNewMembersList] = useState([]);

  // Add Shared Expense Form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPayerName, setExpPayerName] = useState('You');
  const [expSplitType, setExpSplitType] = useState('equal'); // 'equal' | 'custom'
  const [customSplits, setCustomSplits] = useState({});

  // Settlement Form
  const [settleAmount, setSettleAmount] = useState('');
  const [settleRef, setSettleRef] = useState('');

  // Clear any old dummy groups on first mount to ensure clean state
  useEffect(() => {
    const saved = localStorage.getItem('spendly_demo_groups');
    if (saved && saved.includes('Flat 402 Roommates')) {
      localStorage.removeItem('spendly_demo_groups');
    }
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchUserGroups(user?.id);
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
  const balanceData = activeGroup ? calculateGroupBalances(activeGroup) : { debts: [], userOwed: 0, userOwes: 0 };

  // Add Member Pill to New Group
  const handleAddMemberPill = () => {
    if (memberInput.trim() && !newMembersList.includes(memberInput.trim())) {
      setNewMembersList([...newMembersList, memberInput.trim()]);
      setMemberInput('');
    }
  };

  const handleRemoveMemberPill = (name) => {
    setNewMembersList(newMembersList.filter(n => n !== name));
  };

  // Submit Create Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const created = await createExpenseGroup({
        userId: user?.id,
        name: newGroupName,
        description: newGroupDesc,
        groupType: newGroupType,
        memberNames: newMembersList
      });

      await loadGroups();
      setSelectedGroupId(created.id);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewMembersList([]);
      showToast(`Group "${newGroupName}" created!`);
    } catch (err) {
      console.error('Group create error:', err);
      showToast('Failed to create group', 'error');
    }
  };

  // Submit Add Shared Expense
  const handleAddSharedExpense = async (e) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0 || !expTitle.trim() || !activeGroup) return;

    const members = activeGroup.members || [];
    let splits = [];

    if (expSplitType === 'equal') {
      const perHead = Math.round((amount / members.length) * 100) / 100;
      splits = members.map(m => ({
        memberName: m.name,
        userId: m.user_id,
        amount: perHead
      }));
    } else {
      splits = members.map(m => ({
        memberName: m.name,
        userId: m.user_id,
        amount: parseFloat(customSplits[m.name] || 0)
      }));
    }

    try {
      await addSharedGroupExpense({
        groupId: activeGroup.id,
        paidById: user?.id,
        paidByName: expPayerName || 'You',
        title: expTitle,
        amount,
        splitType: expSplitType,
        splits,
        date: new Date().toISOString().slice(0, 10),
        notes: ''
      });

      await loadGroups();
      setShowAddExpenseModal(false);
      setExpTitle('');
      setExpAmount('');
      setCustomSplits({});
      showToast(`Added shared expense: ₹${amount.toLocaleString('en-IN')}`);
    } catch (err) {
      console.error('Add shared expense error:', err);
      showToast('Failed to add shared expense', 'error');
    }
  };

  // Open Settle Modal
  const openSettleModal = (debt) => {
    setSettleDebt(debt);
    setSettleAmount(debt.amount.toString());
    setSettleRef('UPI / GPay');
    setShowSettleModal(true);
  };

  // Submit Settle Up
  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settleDebt || !activeGroup) return;

    try {
      await recordGroupSettlement({
        groupId: activeGroup.id,
        fromName: settleDebt.from,
        toName: settleDebt.to,
        amount: parseFloat(settleAmount),
        paymentReference: settleRef
      });

      await loadGroups();
      setShowSettleModal(false);
      showToast(`Settlement of ₹${settleAmount} recorded!`);
    } catch (err) {
      console.error('Settlement error:', err);
      showToast('Failed to record settlement', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Group Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Feature 2: Expense Splitting with Friends</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Roommates & Friends Split
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Split canteen meals, hostel Wi-Fi, flat rent, or college trips with roommates and friends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-brand-600" />
            <span>New Group</span>
          </button>

          {activeGroup && (
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Split an Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Navigation Tabs if groups exist */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {groups.map(grp => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                selectedGroupId === grp.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{grp.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {grp.members?.length || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* If No Groups Exist (Clean Empty State) */}
      {groups.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            No Expense Groups Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Create a group for your hostel flat, roommates, canteen gang, or an upcoming college trip to record and split expenses easily.
          </p>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Your First Group</span>
          </button>
        </div>
      ) : activeGroup ? (
        <>
          {/* Net Balances Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                You Are Owed (Credits)
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(balanceData.userOwed)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Friends need to pay you
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                You Owe (Debts)
              </span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                -{formatCurrency(balanceData.userOwes)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You need to settle with friends
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Net Group Position
              </span>
              <p className={`text-2xl font-extrabold mt-1 ${
                balanceData.userOwed >= balanceData.userOwes
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {balanceData.userOwed >= balanceData.userOwes ? '+' : '-'}
                {formatCurrency(Math.abs(balanceData.userOwed - balanceData.userOwes))}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {balanceData.userOwed >= balanceData.userOwes ? 'Overall in credit' : 'Overall in debt'}
              </p>
            </div>
          </div>

          {/* Main Grid: Who Owes Whom (Left) & Expense Feed (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Who Owes Whom & Settle Up Section */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Who Owes Whom
                  </h3>
                  <p className="text-xs text-slate-400">Automatic debt simplification for {activeGroup.name}</p>
                </div>
                <UserCheck className="w-5 h-5 text-indigo-500" />
              </div>

              {balanceData.debts.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    All settled up!
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No outstanding debts in this group.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balanceData.debts.map((debt, idx) => {
                    const isYouPayer = debt.from.includes('You');
                    const isYouReceiver = debt.to.includes('You');

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 font-bold flex items-center justify-center text-xs">
                            {debt.from.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                              <span className={isYouPayer ? 'text-rose-600 font-extrabold' : 'text-slate-900 dark:text-white'}>
                                {debt.from}
                              </span>
                              {' owes '}
                              <span className={isYouReceiver ? 'text-emerald-600 font-extrabold' : 'text-slate-900 dark:text-white'}>
                                {debt.to}
                              </span>
                            </p>
                            <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                              {formatCurrency(debt.amount)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => openSettleModal(debt)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          <span>Settle Up</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shared Expenses Feed */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Group Expense History
                  </h3>
                  <p className="text-xs text-slate-400">Shared receipts logged in this group</p>
                </div>
                <Receipt className="w-5 h-5 text-brand-600" />
              </div>

              {(activeGroup.expenses || []).length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No shared expenses logged yet</p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="mt-3 text-xs font-bold text-brand-600 hover:underline"
                  >
                    + Log the first split
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                  {(activeGroup.expenses || []).map(exp => (
                    <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          {exp.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Paid by <strong className="text-slate-600 dark:text-slate-300">{exp.paid_by_name}</strong> • {formatDate(exp.date)} • {exp.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(exp.amount)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          ₹{Math.round(exp.amount / (activeGroup.members?.length || 1))}/person
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Modal: Create New Group */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create Roommate / Friend Group
              </h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Flat 302, Goa College Trip, Tech Team"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Group Type
                </label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                >
                  <option value="roommates">🏠 Roommates / Hostel Flat</option>
                  <option value="trip">🏖️ College Trip / Vacation</option>
                  <option value="project">💻 Hackathon / Campus Project</option>
                  <option value="fest">🎉 College Fest Committee</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Add Friends / Roommates
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    placeholder="Friend name (e.g. Rohan)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddMemberPill}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    Add
                  </button>
                </div>

                {/* Member Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200">
                    You (Admin)
                  </span>
                  {newMembersList.map(name => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberPill(name)}
                        className="hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Shared Expense */}
      {showAddExpenseModal && activeGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Split an Expense in {activeGroup.name}
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSharedExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi bill, Dinner, Grocery run"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Who Paid?
                  </label>
                  <select
                    value={expPayerName}
                    onChange={(e) => setExpPayerName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-medium"
                  >
                    {activeGroup.members?.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Split Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpSplitType('equal')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      expSplitType === 'equal'
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
                    }`}
                  >
                    Equally (₹{expAmount ? (parseFloat(expAmount) / (activeGroup.members?.length || 1)).toFixed(0) : '0'}/each)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpSplitType('custom')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      expSplitType === 'custom'
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
                    }`}
                  >
                    Custom Amounts
                  </button>
                </div>
              </div>

              {/* Custom splits input fields */}
              {expSplitType === 'custom' && (
                <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                  {activeGroup.members?.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}:</span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={customSplits[m.name] || ''}
                          onChange={(e) => setCustomSplits({ ...customSplits, [m.name]: e.target.value })}
                          className="w-full pl-6 pr-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                >
                  Save Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settle Up */}
      {showSettleModal && settleDebt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Record UPI Settlement
              </h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Recording payment from <strong className="text-slate-900 dark:text-white">{settleDebt.from}</strong> to <strong className="text-slate-900 dark:text-white">{settleDebt.to}</strong>.
            </p>

            <form onSubmit={handleRecordSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Settlement Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Reference (UPI ID / Ref)
                </label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. GPay UPI #91829"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
