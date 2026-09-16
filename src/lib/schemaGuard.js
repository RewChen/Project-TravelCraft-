// Thin helper that remembers which Supabase tables/columns are currently
// missing from the remote database (PostgREST 404/400) so known-failing
// hydration queries stop firing on every page load. Results are cached in
// localStorage with a short TTL: after the schema SQL has been applied and the
// TTL passes (or the cache is cleared), the app re-probes automatically.

const STORAGE_KEY = 'travelcraft_schema_guard';
const TTL_MS = 5 * 60 * 1000;

const readCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const now = Date.now();
    const out = {};
    for (const [key, ts] of Object.entries(parsed)) {
      if (Number.isFinite(ts) && now - ts < TTL_MS) out[key] = ts;
    }
    return out;
  } catch {
    return {};
  }
};

const cache = typeof window !== 'undefined' ? readCache() : {};

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage failures (private mode / quota)
  }
};

export const isSchemaMissing = (key) => Boolean(cache[key]);

export const markSchemaMissing = (key) => {
  cache[key] = Date.now();
  persist();
};

export const clearSchemaMissing = (key) => {
  delete cache[key];
  persist();
};

// True when the error is a missing relation (404 / PGRST205) or a missing
// column inside a filtered SELECT (400 "column ... does not exist") or a stale
// PostgREST schema cache ("could not find the 'x' column of 'y' in the schema cache").
export const isMissingSchemaError = (error) => {
  if (!error) return false;
  const status = Number(error?.status);
  const message = String(error?.message || '');
  if (status === 404) return true;
  if (status === 400 && /column .* does not exist/.test(message)) return true;
  return /could not find the table|relation .* does not exist|could not find the .* in the schema cache/i.test(message);
};