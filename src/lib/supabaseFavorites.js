import { supabase } from './supabaseClient';
import { isSchemaMissing, markSchemaMissing, clearSchemaMissing, isMissingSchemaError } from './schemaGuard';

// Per-user favorited locations table (public.favorites).
// Source of truth when signed in; localStorage remains the guest/offline mirror.

// Fetch all favorited location titles for a user, oldest first.
export const fetchFavorites = async (uid) => {
  if (!uid || isSchemaMissing('favorites')) return null;
  const { data, error } = await supabase
    .from('favorites')
    .select('location_title')
    .eq('user_id', uid)
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('favorites');
    throw error;
  }
  clearSchemaMissing('favorites');
  return (data || []).map((row) => row.location_title);
};

// Add a favorite row for a user (unique per user + location title).
export const insertFavorite = async (uid, locationTitle) => {
  if (!uid || !locationTitle) return null;
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: uid, location_title: locationTitle })
    .select()
    .single();
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('favorites');
    throw error;
  }
  clearSchemaMissing('favorites');
  return data || null;
};

// Remove a favorite row for a user.
export const deleteFavorite = async (uid, locationTitle) => {
  if (!uid || !locationTitle) return;
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', uid)
    .eq('location_title', locationTitle);
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('favorites');
    throw error;
  }
  clearSchemaMissing('favorites');
};