# Firestore Rules & Testing Checklist ✅

This file explains the provided Firestore security rules (`firebase/firestore.rules`) and how to test them locally before deploying.

## Summary of rules
- profiles/{uid}:
  - Create: only the authenticated user with uid == doc id (or admin)
  - Read: owner or admin
  - Update/Delete: owner or admin
- user_roles/{uid}:
  - Read: owner or admin
  - Write (create/update/delete): admin only

These rules assume `user_roles` documents are created and maintained by admins. Roles are simple strings: `admin`, `member`, `visitor`, `guest`.

## Deploying rules
1. Install Firebase CLI: `npm i -g firebase-tools` (if not installed)
2. Login and select project: `firebase login` then `firebase use --add` (pick your project)
3. Deploy only rules: `firebase deploy --only firestore:rules`

> Important: Keep rules reviewed before deploy and test on staging or using the emulator.

## Testing locally with Emulator (recommended)
1. Start emulators (Auth + Firestore):
   - `firebase emulators:start --only auth,firestore`
2. Use the Emulator UI or Admin SDK to create test users and roles.
3. Test scenarios (manual or with a small Node script):
   - Signed-in user A creates own profile (should succeed).
   - Signed-in user A reads own profile (should succeed).
   - Signed-in user A reads user B profile (should fail unless A is admin).
   - Admin user reads/updates other profiles and user_roles (should succeed).
4. Example environment variables for local testing:
   - `FIRESTORE_EMULATOR_HOST=localhost:8080`
   - `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`

## Quick manual checklist
- [ ] Start emulators and create a normal user (A) and test user (B)
- [ ] Confirm A can create and update their profile
- [ ] Confirm A cannot read or modify B's profile (403)
- [ ] Create admin role doc for A and confirm A can now read/modify B's profile
- [ ] Confirm only admins can create/update `user_roles` documents

If you want, I can add a simple Node test script that runs these checks automatically against the emulator and report pass/fail results. Want me to add that script? 🔧