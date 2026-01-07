# Migration to Firebase — Steps & Checklist

This document describes how to perform a full migration from Supabase (Postgres + Supabase Auth + Storage) to Firebase (Firestore + Firebase Auth + Storage).

## Preparations (what I need from you)
- Firebase Service Account JSON file (download from Firebase Console → Project Settings → Service accounts). Do NOT commit this file. Set it locally as:
  - `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"` or set `FIREBASE_SERVICE_ACCOUNT_PATH` env var.
- Indicate whether you want to preserve user passwords:
  - If YES: provide password hashes export (including algorithm and any salt parameters), or coordinate how to export them from Postgres.
  - If NO: I will import users without passwords and generate password reset links (or you can invite users).
- If you want me to export data from Supabase directly, provide a secure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` for a short time so I can run the export script, or provide a database dump (preferred).

## Scripts available (in repo under `scripts/firebase`)
- `node importCollections.cjs --profiles=./data/profiles.json --roles=./data/user_roles.json`
  - Imports `profiles` and `user_roles` JSON exports into Firestore.
- `node importUsers.cjs --users=./data/users.json [--hash-algo=BCRYPT|SCRYPT]`
  - Imports users. If `passwordHash` fields are present and `--hash-algo` set, it uses `auth.importUsers` to preserve password hashes (limited support).
  - Otherwise creates users and prints password reset links.
- `node exportFromSupabase.cjs`
  - Optional: uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars to export `profiles` and `user_roles` into `scripts/firebase/data`.

## Typical workflow
1. Provide service account & (optionally) Supabase service_role key or data dump.
2. Run export from Supabase locally (or share dump):
   - `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/firebase/exportFromSupabase.cjs`
3. Verify `scripts/firebase/data/*.json` files and adjust them if necessary.
4. Import collections: `node scripts/firebase/importCollections.cjs --profiles=./scripts/firebase/data/profiles.json --roles=./scripts/firebase/data/user_roles.json`
5. Import users: if hashes available `node scripts/firebase/importUsers.cjs --users=... --hash-algo=BCRYPT`
   - If not: `node scripts/firebase/importUsers.cjs --users=...` and distribute password reset links.
6. Test the app locally using the Firebase web config in `.env` and confirm auth/reads/writes work.
7. Gradually remove Supabase references and deploy.

## Safety & Notes
- Always test first with a small subset.
- Keep service account & service_role keys private. Use CI secret stores for production imports.
- Firestore rules and storage rules need to be defined to replicate Supabase policies (roles checks have to be implemented via security rules or Cloud Functions).

I've added a starter set of Firestore rules at `firebase/firestore.rules` and a testing checklist at `scripts/firebase/FIRESTORE_RULES.md`. These enforce role-based access for `profiles` and `user_roles` and include instructions for testing with the Firebase Emulator.

If you confirm, I can run the export and import for you here (you'll provide the necessary secrets temporarily), or I can provide exact commands and verify the result after you run them locally.
