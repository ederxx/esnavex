# Firebase Migration Scripts

This folder contains helpers to import data into Firebase (Firestore & Auth).

## Requirements
- Node.js installed
- A Firebase Service Account JSON file and set the environment variable:
  - `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"` (or set `FIREBASE_SERVICE_ACCOUNT_PATH`)
- Project must exist in Firebase and you must have permissions

## Scripts

1) Import collections (profiles, user_roles):

```
node importCollections.js --profiles=./data/profiles.json --roles=./data/user_roles.json
```

- JSON files should be arrays. `profiles` must include field `id` to use as document id.

2) Import users:

```
# If you have hashed passwords (base64), and know the algorithm (BCRYPT or SCRYPT):
node importUsers.js --users=./data/users.json --hash-algo=BCRYPT

# If you don't have password hashes, import users and print password reset links:
node importUsers.js --users=./data/users.json
```

- `users.json` format example:
```json
[
  { "uid": "abc123", "email": "user@example.com", "displayName": "User" }
]
```

## Notes
- The user import script supports limited hash options. For complex hash migrations (PBKDF2, custom salts), we might need specialized conversion scripts.
- Always run these scripts locally first and verify a few documents/users before importing everything.
