import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../utils/constants';

/**
 * Categories Service
 * Interacts with the Supabase `categories` table.
 */

export async function fetchCategories(userId) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // If user has no categories in database yet, seed the default campus categories
    if (!data || data.length === 0) {
      return await seedDefaultCategories(userId);
    }

    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return local fallback categories if offline or during initial setup
    return DEFAULT_CATEGORIES;
  }
}

export async function seedDefaultCategories(userId) {
  try {
    if (!userId) return DEFAULT_CATEGORIES;

    const toInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: userId,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      is_default: true
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(toInsert)
      .select();

    if (error) throw error;
    return data || DEFAULT_CATEGORIES;
  } catch (e) {
    console.warn('Seeding categories note:', e.message);
    return DEFAULT_CATEGORIES;
  }
}
