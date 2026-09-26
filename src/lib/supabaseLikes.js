import { supabase } from './supabaseClient';
import { isSchemaMissing, markSchemaMissing, clearSchemaMissing, isMissingSchemaError } from './schemaGuard';

// Per-user likes for a location with a public count (public.location_likes).
// location_key identifies the spot (pin id, with the title as fallback).

// Combined read: total like count (public) + whether this user liked it.
export const fetchLikeInfo = async (locationKey, uid) => {
  if (!locationKey || isSchemaMissing('location_likes')) return null;
  const countPromise = supabase
    .from('location_likes')
    .select('location_key', { count: 'exact', head: true })
    .eq('location_key', locationKey);
  const minePromise = uid
    ? supabase
        .from('location_likes')
        .select('location_key')
        .eq('location_key', locationKey)
        .eq('user_id', uid)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [countRes, mineRes] = await Promise.all([countPromise, minePromise]);
  const error = countRes.error || mineRes.error;
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('location_likes');
    throw error;
  }
  clearSchemaMissing('location_likes');
  return { count: countRes.count || 0, liked: Boolean(mineRes.data) };
};

// Like a location for a user (unique per user + location key).
export const insertLike = async (uid, locationKey) => {
  if (!uid || !locationKey) return null;
  const { data, error } = await supabase
    .from('location_likes')
    .insert({ user_id: uid, location_key: locationKey })
    .select()
    .single();
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('location_likes');
    throw error;
  }
  clearSchemaMissing('location_likes');
  return data || null;
};

// Remove a like row for a user.
export const deleteLike = async (uid, locationKey) => {
  if (!uid || !locationKey) return;
  const { error } = await supabase
    .from('location_likes')
    .delete()
    .eq('user_id', uid)
    .eq('location_key', locationKey);
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('location_likes');
    throw error;
  }
  clearSchemaMissing('location_likes');
};
