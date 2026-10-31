import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user } = useAuth();

  // Dark/Light theme with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('spendly_theme') || 'light';
  });

  // Current page routing state
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeTab, setActiveTab] = useState('all'); // For sub-views or filters
  const [toast, setToast] = useState(null);

  // Apply dark mode class to html
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('spendly_theme', theme);
  }, [theme]);

  // When user logs in, auto switch to dashboard if on landing/auth
  useEffect(() => {
    if (user && (currentPage === 'landing' || currentPage === 'auth')) {
      setCurrentPage('dashboard');
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentPage,
        setCurrentPage,
        activeTab,
        setActiveTab,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
