import { supabase } from './supabaseClient';
import { isSupabaseConfigured } from './supabaseClient';
import { isSchemaMissing, markSchemaMissing, clearSchemaMissing, isMissingSchemaError } from './schemaGuard';

// DB row -> the review shape the UI/context expect (timestamps as epoch ms).
export const rowToReview = (row) => ({
  id: row.id,
  locationId: row.location_id,
  locationName: row.location_name,
  region: row.region || '',
  authorId: row.author_id || null,
  authorName: row.author_name,
  avatar: row.avatar || null,
  authorLevel: row.author_level ?? 1,
  authorTitle: row.author_title || null,
  authorRole: row.author_role || null,
  rating: Number(row.rating) || 5,
  text: row.text || '',
  images: Array.isArray(row.images) ? row.images : [],
  status: row.status,
  pinned: Boolean(row.pinned),
  reports: row.reports || 0,
  helpful: row.helpful || 0,
  gpsVerified: Boolean(row.gps_verified),
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

const reviewToRow = (review) => ({
  id: review.id,
  location_id: review.locationId || review.locationName || 'unknown',
  location_name: review.locationName || 'Unknown location',
  region: review.region || '',
  author_id: review.authorId || null,
  author_name: review.authorName || 'Traveler',
  avatar: review.avatar || null,
  author_level: review.authorLevel ?? 1,
  author_title: review.authorTitle || null,
  author_role: review.authorRole || null,
  rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
  text: review.text || '',
  images: Array.isArray(review.images) ? review.images.slice(0, 4) : [],
  status: review.status || 'pending',
  pinned: Boolean(review.pinned),
  reports: review.reports || 0,
  helpful: review.helpful || 0,
  gps_verified: Boolean(review.gpsVerified),
});

// Fetch visible reviews (RLS decides: approved for everyone, own + admin all).
export const fetchReviews = async () => {
  if (!isSupabaseConfigured || isSchemaMissing('reviews')) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('reviews');
    throw error;
  }
  clearSchemaMissing('reviews');
  return (data || []).map(rowToReview);
};

export const insertReview = async (review) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewToRow(review))
    .select()
    .single();
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('reviews');
    throw error;
  }
  clearSchemaMissing('reviews');
  return data ? rowToReview(data) : null;
};

export const updateReviewStatus = async (reviewId, status) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', reviewId);
  if (error) throw error;
};

export const setReviewPinned = async (reviewId, pinned) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('reviews')
    .update({ pinned })
    .eq('id', reviewId);
  if (error) throw error;
};

export const deleteReviewRow = async (reviewId) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  if (error) throw error;
};

// Helpful / report counters are bumped via a STORED FUNCTION so ANY user can
// increment them without being blocked by the author/admin-only UPDATE policy
// and without being able to overwrite other columns.
export const bumpReviewCounter = async (reviewId, field) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.rpc('bump_review_counter', {
    rev_id: reviewId,
    field,
  });
  if (error) {
    if (isMissingSchemaError(error)) markSchemaMissing('reviews');
    throw error;
  }
};