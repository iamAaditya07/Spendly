import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'scholar@campus.edu',
  user_metadata: {
    full_name: 'Aaditya (Campus Scholar)',
    college_name: 'Campus College',
    monthly_pocket_money: 8500
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spendly_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('spendly_auth_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial active session from Supabase
    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('spendly_auth_user', JSON.stringify(session.user));
          await fetchUserProfile(session.user.id);
        }
      } catch (err) {
        console.warn('Session check note:', err.message);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('spendly_auth_user', JSON.stringify(session.user));
        await fetchUserProfile(session.user.id);
      } else {
        // If not a demo user, clear
        const isDemo = localStorage.getItem('spendly_is_demo') === 'true';
        if (!isDemo) {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('spendly_auth_user');
          localStorage.removeItem('spendly_auth_profile');
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch or fallback profile from Supabase profiles table
  async function fetchUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data);
        localStorage.setItem('spendly_auth_profile', JSON.stringify(data));
      } else {
        const fallback = {
          id: userId,
          full_name: user?.user_metadata?.full_name || 'Campus Scholar',
          college_name: user?.user_metadata?.college_name || 'Campus University',
          monthly_pocket_money: 8500,
          currency: '₹'
        };
        setProfile(fallback);
        localStorage.setItem('spendly_auth_profile', JSON.stringify(fallback));
      }
    } catch (e) {
      console.warn('Profile fetch notice:', e.message);
    }
  }

  // Sign in with Email and Password
  async function signIn(email, password) {
    localStorage.removeItem('spendly_is_demo');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Sign up with Email, Password, Full Name, and College Name
  async function signUp(email, password, metadata = {}) {
    localStorage.removeItem('spendly_is_demo');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.fullName || 'Campus Scholar',
          college_name: metadata.collegeName || 'Campus University',
          student_id: metadata.studentId || '',
          monthly_pocket_money: metadata.monthlyPocketMoney || 8000
        }
      }
    });
    if (error) throw error;
    return data;
  }

  // Sign in as Demo Student
  function signInAsDemo() {
    localStorage.setItem('spendly_is_demo', 'true');
    setUser(DEMO_USER);
    const demoProf = {
      id: DEMO_USER.id,
      full_name: DEMO_USER.user_metadata.full_name,
      college_name: DEMO_USER.user_metadata.college_name,
      monthly_pocket_money: DEMO_USER.user_metadata.monthly_pocket_money,
      currency: '₹'
    };
    setProfile(demoProf);
    localStorage.setItem('spendly_auth_user', JSON.stringify(DEMO_USER));
    localStorage.setItem('spendly_auth_profile', JSON.stringify(demoProf));
  }

  // Sign out
  async function signOut() {
    localStorage.removeItem('spendly_is_demo');
    localStorage.removeItem('spendly_auth_user');
    localStorage.removeItem('spendly_auth_profile');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInAsDemo,
        signOut,
        fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
