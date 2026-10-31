// Spendly Main Application Logic
// Orchestrates state, views, events, and chart visualizations

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const now = new Date();
  const state = {
    selectedYear: now.getFullYear(),
    selectedMonth: now.getMonth(), // 0 - 11
    searchQuery: '',
    categoryFilter: 'all',
    currency: window.spendlyStore.getCurrency(),
    theme: window.spendlyStore.getTheme(),
    lastDeletedExpense: null
  };

  // DOM Elements
  const elements = {
    // Header
    currentMonthDisplay: document.getElementById('current-month-display'),
    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    todayBtn: document.getElementById('today-btn'),
    currencySelect: document.getElementById('currency-select'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeMoonIcon: document.getElementById('theme-moon-icon'),
    themeSunIcon: document.getElementById('theme-sun-icon'),
    openSettingsBtn: document.getElementById('open-settings-btn'),

    // Metric Cards
    statTotalSpent: document.getElementById('stat-total-spent'),
    statTxCount: document.getElementById('stat-tx-count'),
    statBudgetRemaining: document.getElementById('stat-budget-remaining'),
    statBudgetPercent: document.getElementById('stat-budget-percent'),
    statBudgetTarget: document.getElementById('stat-budget-target'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    openBudgetBtn: document.getElementById('open-budget-btn'),
    statDailyAvg: document.getElementById('stat-daily-avg'),
    statTopCategory: document.getElementById('stat-top-category'),
    statTopCategoryAmount: document.getElementById('stat-top-category-amount'),
    statTopCategoryShare: document.getElementById('stat-top-category-share'),

    // Expense Form
    expenseForm: document.getElementById('expense-form'),
    expAmount: document.getElementById('exp-amount'),
    expTitle: document.getElementById('exp-title'),
    expCategory: document.getElementById('exp-category'),
    expDate: document.getElementById('exp-date'),
    expNotes: document.getElementById('exp-notes'),
    formCurrencySymbol: document.getElementById('form-currency-symbol'),
    categoryChips: document.querySelectorAll('.category-chip'),

    // Transactions List & Filters
    txSearchInput: document.getElementById('tx-search-input'),
    txCategoryFilter: document.getElementById('tx-category-filter'),
    transactionsList: document.getElementById('transactions-list'),
    transactionsCountBadge: document.getElementById('transactions-count-badge'),

    // Charts & Analytics Containers
    donutChartContainer: document.getElementById('donut-chart-container'),
    categoryBreakdownList: document.getElementById('category-breakdown-list'),
    dailyChartContainer: document.getElementById('daily-chart-container'),

    // Edit Modal
    editModal: document.getElementById('edit-modal'),
    closeEditModalBtn: document.getElementById('close-edit-modal-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    editExpenseForm: document.getElementById('edit-expense-form'),
    editExpId: document.getElementById('edit-exp-id'),
    editExpAmount: document.getElementById('edit-exp-amount'),
    editExpTitle: document.getElementById('edit-exp-title'),
    editExpCategory: document.getElementById('edit-exp-category'),
    editExpDate: document.getElementById('edit-exp-date'),
    editExpNotes: document.getElementById('edit-exp-notes'),
    editFormCurrencySymbol: document.getElementById('edit-form-currency-symbol'),

    // Budget Modal
    budgetModal: document.getElementById('budget-modal'),
    closeBudgetModalBtn: document.getElementById('close-budget-modal-btn'),
    cancelBudgetBtn: document.getElementById('cancel-budget-btn'),
    budgetForm: document.getElementById('budget-form'),
    budgetInput: document.getElementById('budget-input'),
    budgetCurrencySymbol: document.getElementById('budget-currency-symbol'),

    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    importJsonInput: document.getElementById('import-json-input'),
    resetSampleBtn: document.getElementById('reset-sample-btn'),
    clearAllDataBtn: document.getElementById('clear-all-data-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper: Format Currency
  function formatMoney(amount) {
    return `${state.currency}${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Helper: Today's formatted YYYY-MM-DD
  function getTodayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Toast Notification System
  function showToast(message, type = 'normal', undoAction = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
      ${undoAction ? `<button class="toast-undo-btn" style="background:none;border:none;color:#60A5FA;font-weight:700;margin-left:8px;cursor:pointer;">Undo</button>` : ''}
    `;

    if (undoAction) {
      toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        undoAction();
        toast.remove();
      });
    }

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, undoAction ? 5500 : 3500);
  }

  // Initialize Theme
  function applyTheme(theme) {
    state.theme = theme;
    window.spendlyStore.setTheme(theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      elements.themeMoonIcon.style.display = 'none';
      elements.themeSunIcon.style.display = 'block';
    } else {
      document.body.classList.remove('dark-mode');
      elements.themeMoonIcon.style.display = 'block';
      elements.themeSunIcon.style.display = 'none';
    }
    render();
  }

  // Initialize Currency
  function applyCurrency(symbol) {
    state.currency = symbol;
    window.spendlyStore.setCurrency(symbol);
    elements.currencySelect.value = symbol;
    elements.formCurrencySymbol.textContent = symbol;
    elements.editFormCurrencySymbol.textContent = symbol;
    elements.budgetCurrencySymbol.textContent = symbol;
    render();
  }

  // Update Month Navigation Header
  function updateMonthDisplay() {
    elements.currentMonthDisplay.textContent = `${MONTH_NAMES[state.selectedMonth]} ${state.selectedYear}`;
  }

  // Set default date in form to today (or 1st of month if viewing another month)
  function setFormDefaultDate() {
    const today = new Date();
    if (today.getFullYear() === state.selectedYear && today.getMonth() === state.selectedMonth) {
      elements.expDate.value = getTodayIso();
    } else {
      const pad = (n) => String(n).padStart(2, '0');
      elements.expDate.value = `${state.selectedYear}-${pad(state.selectedMonth + 1)}-01`;
    }
  }

  // Render Overview Metric Cards
  function renderMetrics(analytics) {
    // Total Spent
    elements.statTotalSpent.textContent = formatMoney(analytics.totalSpent);
    elements.statTxCount.textContent = `${analytics.transactionCount} ${analytics.transactionCount === 1 ? 'expense' : 'expenses'}`;

    // Budget Status
    const budget = analytics.budget;
    const remaining = analytics.remainingBudget;
    elements.statBudgetTarget.textContent = formatMoney(budget);

    if (remaining >= 0) {
      elements.statBudgetRemaining.textContent = formatMoney(remaining);
      elements.statBudgetRemaining.style.color = 'var(--text-primary)';
      elements.statBudgetPercent.textContent = `${analytics.budgetPercent.toFixed(0)}%`;
    } else {
      elements.statBudgetRemaining.textContent = `-${formatMoney(Math.abs(remaining))}`;
      elements.statBudgetRemaining.style.color = 'var(--accent-danger)';
      elements.statBudgetPercent.textContent = `${analytics.budgetPercent.toFixed(0)}% (Over)`;
    }

    // Budget Progress Bar
    const percentClamped = Math.min(100, analytics.budgetPercent);
    elements.budgetProgressBar.style.width = `${percentClamped}%`;
    elements.budgetProgressBar.className = 'budget-progress-bar ' + (
      analytics.budgetPercent >= 100 ? 'danger' :
      analytics.budgetPercent >= 80 ? 'warning' : 'normal'
    );

    // Daily Average
    elements.statDailyAvg.textContent = formatMoney(analytics.averageDaily);

    // Top Category
    if (analytics.categoryBreakdown.length > 0) {
      const top = analytics.categoryBreakdown[0];
      elements.statTopCategory.textContent = top.category.name;
      elements.statTopCategoryAmount.textContent = formatMoney(top.total);
      elements.statTopCategoryShare.textContent = `(${top.percentage.toFixed(0)}% of total)`;
    } else {
      elements.statTopCategory.textContent = 'None';
      elements.statTopCategoryAmount.textContent = formatMoney(0);
      elements.statTopCategoryShare.textContent = '';
    }
  }

  // Render Category Breakdown Bars
  function renderCategoryList(categoryBreakdown, totalSpent) {
    elements.categoryBreakdownList.innerHTML = '';
    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      return;
    }

    categoryBreakdown.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cat-progress-row';
      row.innerHTML = `
        <div class="cat-row-header">
          <div class="cat-row-name-wrap">
            <span class="cat-dot" style="background-color: ${item.category.color}"></span>
            <span>${item.category.name}</span>
          </div>
          <div>
            <span class="cat-row-numbers">${formatMoney(item.total)}</span>
            <span class="cat-row-percent">${item.percentage.toFixed(1)}%</span>
          </div>
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width: ${item.percentage}%; background-color: ${item.category.color};"></div>
        </div>
      `;
      elements.categoryBreakdownList.appendChild(row);
    });
  }

  // Format date helper for transaction grouping
  function formatGroupDate(dateString) {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = today.getFullYear() === y && today.getMonth() === (m - 1) && today.getDate() === d;
    const isYesterday = yesterday.getFullYear() === y && yesterday.getMonth() === (m - 1) && yesterday.getDate() === d;

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = MONTH_NAMES[m - 1].slice(0, 3);
    return `${dayName}, ${monthName} ${d}`;
  }

  // Render Transactions List with search & category filters
  function renderTransactions(expenses) {
    elements.transactionsList.innerHTML = '';

    // Apply filters
    let filtered = expenses;

    if (state.categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === state.categoryFilter);
    }

    if (state.searchQuery.trim() !== '') {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(e => {
        const titleMatch = (e.title || '').toLowerCase().includes(query);
        const notesMatch = (e.notes || '').toLowerCase().includes(query);
        const catObj = CATEGORIES[e.category];
        const catMatch = catObj ? catObj.name.toLowerCase().includes(query) : false;
        return titleMatch || notesMatch || catMatch;
      });
    }

    elements.transactionsCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`;

    if (filtered.length === 0) {
      elements.transactionsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <div class="empty-title">No transactions found</div>
          <div class="empty-sub">${state.searchQuery || state.categoryFilter !== 'all' ? 'Try adjusting your search or category filter.' : 'Log an expense above to get started.'}</div>
        </div>
      `;
      return;
    }

    // Group by date
    let lastDate = null;

    filtered.forEach(item => {
      if (item.date !== lastDate) {
        lastDate = item.date;
        const dateDivider = document.createElement('div');
        dateDivider.className = 'transaction-date-divider';
        dateDivider.textContent = formatGroupDate(item.date);
        elements.transactionsList.appendChild(dateDivider);
      }

      const cat = CATEGORIES[item.category] || CATEGORIES.other;

      const catBg = state.theme === 'dark' ? cat.darkBgColor : cat.bgColor;

      const txItem = document.createElement('div');
      txItem.className = 'transaction-item';
      txItem.innerHTML = `
        <div class="tx-left">
          <div class="tx-icon-wrap" style="background-color: ${catBg}; color: ${cat.color};">
            ${cat.icon}
          </div>
          <div class="tx-info">
            <span class="tx-title">${escapeHtml(item.title)}</span>
            <div class="tx-meta">
              <span class="tx-category-badge" style="color: ${cat.color};">${cat.name}</span>
              ${item.notes ? `<span>•</span><span class="tx-notes-tag" title="${escapeHtml(item.notes)}">${escapeHtml(item.notes)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount">-${formatMoney(item.amount)}</span>
          <div class="tx-actions">
            <button class="tx-action-btn edit-btn" title="Edit Expense" data-id="${item.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="tx-action-btn delete-btn" title="Delete Expense" data-id="${item.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Edit Button
      txItem.querySelector('.edit-btn').addEventListener('click', () => {
        openEditModal(item);
      });

      // Delete Button with undo
      txItem.querySelector('.delete-btn').addEventListener('click', () => {
        handleDeleteExpense(item);
      });

      elements.transactionsList.appendChild(txItem);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Handle Delete with Undo
  function handleDeleteExpense(item) {
    state.lastDeletedExpense = item;
    window.spendlyStore.deleteExpense(item.id);
    render();
    showToast(`Deleted "${item.title}"`, 'normal', () => {
      // Undo callback
      window.spendlyStore.addExpense(state.lastDeletedExpense);
      render();
      showToast(`Restored "${state.lastDeletedExpense.title}"`, 'success');
      state.lastDeletedExpense = null;
    });
  }

  // Open Edit Modal
  function openEditModal(item) {
    elements.editExpId.value = item.id;
    elements.editExpAmount.value = item.amount;
    elements.editExpTitle.value = item.title;
    elements.editExpCategory.value = item.category in CATEGORIES ? item.category : 'other';
    elements.editExpDate.value = item.date;
    elements.editExpNotes.value = item.notes || '';
    elements.editModal.classList.add('active');
  }

  function closeEditModal() {
    elements.editModal.classList.remove('active');
  }

  // Open Budget Modal
  function openBudgetModal() {
    elements.budgetInput.value = window.spendlyStore.getMonthlyBudget();
    elements.budgetModal.classList.add('active');
  }

  function closeBudgetModal() {
    elements.budgetModal.classList.remove('active');
  }

  // Open Settings Modal
  function openSettingsModal() {
    elements.settingsModal.classList.add('active');
  }

  function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
  }

  // Main Render Orchestrator
  function render() {
    updateMonthDisplay();

    // Get calculated analytics from store
    const analytics = window.spendlyStore.getMonthlyAnalytics(state.selectedYear, state.selectedMonth);

    // 1. Render Metrics
    renderMetrics(analytics);

    // 2. Render Donut Chart & Category List
    window.spendlyCharts.renderDonutChart(
      elements.donutChartContainer,
      analytics.categoryBreakdown,
      analytics.totalSpent,
      state.currency
    );
    renderCategoryList(analytics.categoryBreakdown, analytics.totalSpent);

    // 3. Render Daily Bar Chart
    window.spendlyCharts.renderDailyBarChart(
      elements.dailyChartContainer,
      analytics.dailyBreakdown,
      analytics.averageDaily,
      state.currency,
      state.selectedMonth,
      state.selectedYear
    );

    // 4. Render Filtered Transactions List
    renderTransactions(analytics.expenses);
  }

  // EVENT LISTENERS

  // Month navigation
  elements.prevMonthBtn.addEventListener('click', () => {
    if (state.selectedMonth === 0) {
      state.selectedMonth = 11;
      state.selectedYear -= 1;
    } else {
      state.selectedMonth -= 1;
    }
    setFormDefaultDate();
    render();
  });

  elements.nextMonthBtn.addEventListener('click', () => {
    if (state.selectedMonth === 11) {
      state.selectedMonth = 0;
      state.selectedYear += 1;
    } else {
      state.selectedMonth += 1;
    }
    setFormDefaultDate();
    render();
  });

  elements.todayBtn.addEventListener('click', () => {
    const today = new Date();
    state.selectedYear = today.getFullYear();
    state.selectedMonth = today.getMonth();
    setFormDefaultDate();
    render();
  });

  // Theme toggle
  elements.themeToggleBtn.addEventListener('click', () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });

  // Currency select
  elements.currencySelect.addEventListener('change', (e) => {
    applyCurrency(e.target.value);
    showToast(`Currency changed to ${e.target.value}`);
  });

  // Category Quick Chips
  elements.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      elements.expCategory.value = cat;
      elements.expAmount.focus();
    });
  });

  // Keyboard shortcut: Cmd/Ctrl + Enter submits expense form
  elements.expenseForm.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      elements.expenseForm.requestSubmit();
    }
  });

  // Add Expense Form Submit
  elements.expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(elements.expAmount.value);
    const title = elements.expTitle.value.trim();
    const category = elements.expCategory.value;
    const date = elements.expDate.value;
    const notes = elements.expNotes.value.trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'danger');
      return;
    }
    if (!title) {
      showToast('Please enter a description', 'danger');
      return;
    }
    if (!date) {
      showToast('Please select a date', 'danger');
      return;
    }

    const newExp = window.spendlyStore.addExpense({
      amount,
      title,
      category,
      date,
      notes
    });

    // Check if expense date matches current viewing month
    const [expYear, expMonth] = date.split('-').map(Number);
    if (expYear !== state.selectedYear || (expMonth - 1) !== state.selectedMonth) {
      state.selectedYear = expYear;
      state.selectedMonth = expMonth - 1;
      showToast(`Expense logged! Jumped to ${MONTH_NAMES[state.selectedMonth]} ${state.selectedYear}`, 'success');
    } else {
      showToast(`Expense logged: -${formatMoney(amount)}`, 'success');
    }

    // Reset inputs
    elements.expAmount.value = '';
    elements.expTitle.value = '';
    elements.expNotes.value = '';
    setFormDefaultDate();
    elements.expAmount.focus();

    render();
  });

  // Search input filter
  elements.txSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    const analytics = window.spendlyStore.getMonthlyAnalytics(state.selectedYear, state.selectedMonth);
    renderTransactions(analytics.expenses);
  });

  // Category filter select
  elements.txCategoryFilter.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    const analytics = window.spendlyStore.getMonthlyAnalytics(state.selectedYear, state.selectedMonth);
    renderTransactions(analytics.expenses);
  });

  // Edit Expense Form Submit
  elements.editExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = elements.editExpId.value;
    const amount = parseFloat(elements.editExpAmount.value);
    const title = elements.editExpTitle.value.trim();
    const category = elements.editExpCategory.value;
    const date = elements.editExpDate.value;
    const notes = elements.editExpNotes.value.trim();

    if (!amount || amount <= 0 || !title || !date) {
      showToast('Please fill all required fields', 'danger');
      return;
    }

    window.spendlyStore.updateExpense(id, {
      amount,
      title,
      category,
      date,
      notes
    });

    closeEditModal();
    render();
    showToast('Expense updated', 'success');
  });

  elements.closeEditModalBtn.addEventListener('click', closeEditModal);
  elements.cancelEditBtn.addEventListener('click', closeEditModal);

  // Budget Modal
  elements.openBudgetBtn.addEventListener('click', openBudgetModal);
  elements.closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
  elements.cancelBudgetBtn.addEventListener('click', closeBudgetModal);

  elements.budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newBudget = parseFloat(elements.budgetInput.value);
    if (!newBudget || newBudget <= 0) {
      showToast('Please enter a valid budget amount', 'danger');
      return;
    }
    window.spendlyStore.setMonthlyBudget(newBudget);
    closeBudgetModal();
    render();
    showToast(`Monthly budget set to ${formatMoney(newBudget)}`, 'success');
  });

  // Settings & Data Modal
  elements.openSettingsBtn.addEventListener('click', openSettingsModal);
  elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);

  // Export CSV
  elements.exportCsvBtn.addEventListener('click', () => {
    window.spendlyStore.exportCSV(state.selectedYear, state.selectedMonth);
    showToast('CSV report downloaded', 'success');
  });

  // Export JSON Backup
  elements.exportJsonBtn.addEventListener('click', () => {
    window.spendlyStore.exportJSON();
    showToast('Backup JSON downloaded', 'success');
  });

  // Import JSON Backup
  elements.importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = window.spendlyStore.importJSON(event.target.result);
      if (success) {
        state.currency = window.spendlyStore.getCurrency();
        elements.currencySelect.value = state.currency;
        closeSettingsModal();
        render();
        showToast('Data restored successfully', 'success');
      } else {
        showToast('Failed to import backup file', 'danger');
      }
      elements.importJsonInput.value = '';
    };
    reader.readAsText(file);
  });

  // Reset sample data
  elements.resetSampleBtn.addEventListener('click', () => {
    if (confirm('Load demo transactions? This will repopulate sample records.')) {
      window.spendlyStore.resetToSampleData();
      closeSettingsModal();
      render();
      showToast('Sample data reloaded', 'success');
    }
  });

  // Clear all data
  elements.clearAllDataBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all expense records? This cannot be undone.')) {
      window.spendlyStore.clearAllData();
      closeSettingsModal();
      render();
      showToast('All expense data cleared', 'danger');
    }
  });

  // Close modals when clicking backdrop
  [elements.editModal, elements.budgetModal, elements.settingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeBudgetModal();
      closeSettingsModal();
    }
  });

  // Initial Boot
  applyTheme(state.theme);
  applyCurrency(state.currency);
  setFormDefaultDate();
  render();
});
