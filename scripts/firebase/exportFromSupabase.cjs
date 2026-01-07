#!/usr/bin/env node
/*
  Export certain tables from Supabase (Postgres) using service_role key.

  Usage:
    export SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." && node exportFromSupabase.cjs

  Output files (in scripts/firebase/data):
    - profiles.json
    - user_roles.json
    - users.json (if auth.users is accessible via Supabase)

  Note: Be careful with service_role key - keep it secret and do not commit it.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

(async function main() {
  try {
    console.log('Fetching profiles...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) throw pErr;

    console.log('Fetching user_roles...');
    const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
    if (rErr) throw rErr;

    const outDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, 'profiles.json'), JSON.stringify(profiles, null, 2));
    fs.writeFileSync(path.join(outDir, 'user_roles.json'), JSON.stringify(roles, null, 2));

    console.log('Exported profiles and user_roles to scripts/firebase/data');
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
})();
