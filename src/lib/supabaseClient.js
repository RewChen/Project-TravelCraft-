import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNoopQuery = () => {
  const query = { data: [], error: null };
  query.select = () => query;
  query.order = () => query;
  query.limit = () => query;
  query.eq = () => query;
  query.update = () => query;
  query.delete = () => query;
  query.upsert = () => query;
  return query;
};

const fallbackSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: async () => ({ data: { url: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => createNoopQuery(),
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: async () => ({ error: null }),
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ error: null }),
    }),
  },
  removeChannel: () => {},
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'travelcraft-auth',
      },
    })
  : fallbackSupabase;
