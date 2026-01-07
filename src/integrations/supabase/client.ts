/* Supabase client removed — this repo has migrated to Firebase. */

// This stub exists to make accidental imports fail fast and to keep the file
// in place for migration tooling (e.g., `scripts/firebase/exportFromSupabase.cjs`).
// If you need to re-run Supabase export scripts, reinstall '@supabase/supabase-js'
// and restore a proper client implementation.

export const supabase = new Proxy({}, {
  get() {
    throw new Error('Supabase client removed. Use Firebase helpers in src/integrations/firebase or run the export script with SUPABASE env vars set.');
  }
}) as any;
