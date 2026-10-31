-- =========================================================================
-- SPENDLY: CAMPUS EXPENSE OPERATING SYSTEM
-- Tagline: "Your Money. Your Campus. Your Control."
-- PostgreSQL Relational Schema & Row Level Security (RLS) Policies
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked directly to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  student_id TEXT,
  monthly_pocket_money NUMERIC(12, 2) DEFAULT 8000.00 CHECK (monthly_pocket_money >= 0),
  currency TEXT DEFAULT '₹',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Tag',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year >= 2020),
  target_budget NUMERIC(12, 2) NOT NULL CHECK (target_budget > 0),
  alert_threshold INT DEFAULT 80 CHECK (alert_threshold BETWEEN 50 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Cash', 'Card', 'NetBanking', 'Other')),
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXPENSE GROUPS TABLE (Feature 2: Expense Splitting with Friends)
CREATE TABLE IF NOT EXISTS public.expense_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT DEFAULT 'roommates' CHECK (group_type IN ('roommates', 'trip', 'project', 'fest', 'other')),
  currency TEXT DEFAULT '₹',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 7. SHARED EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage')),
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXPENSE SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed >= 0),
  has_settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMPTZ
);

-- 9. SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  settlement_date DATE DEFAULT CURRENT_DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SAVINGS GOALS TABLE (Feature 3: Savings Goals)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  category TEXT DEFAULT 'gadget',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SAVINGS CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SUBSCRIPTIONS TABLE (Feature 4: Subscription Tracker)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'weekly', 'yearly')),
  next_payment_date DATE NOT NULL,
  category TEXT DEFAULT 'entertainment',
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CHALLENGES TABLE (Feature 5: No-Spend Challenge)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  target_savings NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CHALLENGE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_no_spend_day BOOLEAN NOT NULL DEFAULT TRUE,
  amount_saved NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, date)
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all 14 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Categories
DROP POLICY IF EXISTS "Users view categories" ON public.categories;
CREATE POLICY "Users view categories" ON public.categories
  FOR SELECT USING (is_default = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Users manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Budgets
DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;
CREATE POLICY "Users manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Transactions
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Users manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Expense Groups
DROP POLICY IF EXISTS "Users view groups" ON public.expense_groups;
CREATE POLICY "Users view groups" ON public.expense_groups
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = expense_groups.id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users create groups" ON public.expense_groups;
CREATE POLICY "Users create groups" ON public.expense_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators update groups" ON public.expense_groups;
CREATE POLICY "Creators update groups" ON public.expense_groups
  FOR UPDATE USING (auth.uid() = created_by);

-- 6. Group Members
DROP POLICY IF EXISTS "View group members" ON public.group_members;
CREATE POLICY "View group members" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.expense_groups eg
      WHERE eg.id = group_members.group_id AND eg.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Manage group members" ON public.group_members;
CREATE POLICY "Manage group members" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.expense_groups eg
      WHERE eg.id = group_members.group_id AND eg.created_by = auth.uid()
    )
  );

-- 7. Shared Expenses
DROP POLICY IF EXISTS "Group members view shared expenses" ON public.shared_expenses;
CREATE POLICY "Group members view shared expenses" ON public.shared_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = shared_expenses.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members insert shared expenses" ON public.shared_expenses;
CREATE POLICY "Group members insert shared expenses" ON public.shared_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = paid_by AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = shared_expenses.group_id AND gm.user_id = auth.uid()
    )
  );

-- 8. Expense Splits
DROP POLICY IF EXISTS "Members view splits" ON public.expense_splits;
CREATE POLICY "Members view splits" ON public.expense_splits
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.shared_expenses se
      JOIN public.group_members gm ON gm.group_id = se.group_id
      WHERE se.id = expense_splits.shared_expense_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members manage splits" ON public.expense_splits;
CREATE POLICY "Members manage splits" ON public.expense_splits
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.shared_expenses se
      WHERE se.id = expense_splits.shared_expense_id AND se.paid_by = auth.uid()
    )
  );

-- 9. Settlements
DROP POLICY IF EXISTS "Members view settlements" ON public.settlements;
CREATE POLICY "Members view settlements" ON public.settlements
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members insert settlements" ON public.settlements;
CREATE POLICY "Members insert settlements" ON public.settlements
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid()
    )
  );

-- 10. Savings Goals & Contributions
DROP POLICY IF EXISTS "Users manage savings goals" ON public.savings_goals;
CREATE POLICY "Users manage savings goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage savings contributions" ON public.savings_contributions;
CREATE POLICY "Users manage savings contributions" ON public.savings_contributions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Subscriptions
DROP POLICY IF EXISTS "Users manage subscriptions" ON public.subscriptions;
CREATE POLICY "Users manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. Challenges & Progress
DROP POLICY IF EXISTS "Users manage challenges" ON public.challenges;
CREATE POLICY "Users manage challenges" ON public.challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage challenge progress" ON public.challenge_progress;
CREATE POLICY "Users manage challenge progress" ON public.challenge_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- AUTH TRIGGER: Automatic Profile Creation on Signup
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, college_name, student_id, monthly_pocket_money)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Campus Scholar'),
    COALESCE(NEW.raw_user_meta_data->>'college_name', 'Campus University'),
    COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
    COALESCE((NEW.raw_user_meta_data->>'monthly_pocket_money')::NUMERIC, 8000.00)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a new user registers in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
