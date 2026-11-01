-- =========================================================================
-- SPENDLY: EXPANSION MIGRATION (FEATURES 7 TO 14)
-- =========================================================================

-- 1. Enhance existing transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_items JSONB,
  ADD COLUMN IF NOT EXISTS is_campus_expense BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS campus_category TEXT;

-- 2. Enhance existing profiles table with campus budget
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS campus_budget NUMERIC(12,2) DEFAULT 4000.00;

-- 3. Feature 7: Receipt Scans Table
CREATE TABLE IF NOT EXISTS public.receipt_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  merchant_name TEXT,
  total_amount NUMERIC(12, 2),
  detected_date DATE DEFAULT CURRENT_DATE,
  category_suggestion TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'discarded')),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on receipt_scans
ALTER TABLE public.receipt_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own receipt scans" ON public.receipt_scans;
CREATE POLICY "Users manage own receipt scans" ON public.receipt_scans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket hint: Create 'receipts' bucket in Supabase dashboard under Storage if using cloud file storage.

-- 4. Feature 8: Financial Health Scores Table
CREATE TABLE IF NOT EXISTS public.financial_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  budget_score INT NOT NULL DEFAULT 0,
  savings_score INT NOT NULL DEFAULT 0,
  consistency_score INT NOT NULL DEFAULT 0,
  emergency_score INT NOT NULL DEFAULT 0,
  subscription_score INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  calculated_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health scores" ON public.financial_health_scores;
CREATE POLICY "Users manage own health scores" ON public.financial_health_scores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Feature 9: AI Chat History Table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ai chat history" ON public.ai_chat_history;
CREATE POLICY "Users manage own ai chat history" ON public.ai_chat_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Feature 12: Notifications and Reminders System
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'budget_warning', 'budget_exceeded', 'savings_goal', 'bill', 'system')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_reminders BOOLEAN DEFAULT TRUE,
  budget_alerts BOOLEAN DEFAULT TRUE,
  savings_goal_reminders BOOLEAN DEFAULT TRUE,
  daily_digest BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
