import { supabase } from '../lib/supabase';

/**
 * Profile Service
 * Manages the user's student profile in Supabase `profiles` table.
 */

export async function getProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
  }

  return data;
}

export async function updateProfile(userId, profileData) {
  if (!userId) return null;

  const payload = {
    full_name: profileData.fullName?.trim(),
    college_name: profileData.collegeName?.trim(),
    student_id: profileData.studentId?.trim() || '',
    monthly_pocket_money: parseFloat(profileData.monthlyPocketMoney) || 8000.00,
    currency: profileData.currency || '₹',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...payload })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}
