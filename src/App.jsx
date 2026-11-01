import React from 'react';
import { useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AddTransactionPage from './pages/AddTransactionPage';
import PocketPlannerPage from './pages/PocketPlannerPage';
import SplitExpensesPage from './pages/SplitExpensesPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ChallengesPage from './pages/ChallengesPage';
import SmartInsightsPage from './pages/SmartInsightsPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import FinancialHealthPage from './pages/FinancialHealthPage';
import FinoraAIPage from './pages/FinoraAIPage';
import ExpenseCalendarPage from './pages/ExpenseCalendarPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { currentPage } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'add-transaction':
        return <AddTransactionPage />;
      case 'pocket-planner':
        return <PocketPlannerPage />;
      case 'split':
        return <SplitExpensesPage />;
      case 'goals':
        return <SavingsGoalsPage />;
      case 'subscriptions':
        return <SubscriptionsPage />;
      case 'challenges':
        return <ChallengesPage />;
      case 'insights':
        return <SmartInsightsPage />;
      case 'receipt-scanner':
        return <ReceiptScannerPage />;
      case 'financial-health':
        return <FinancialHealthPage />;
      case 'finora-ai':
        return <FinoraAIPage />;
      case 'expense-calendar':
        return <ExpenseCalendarPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderCurrentPage()}
    </AppLayout>
  );
}
