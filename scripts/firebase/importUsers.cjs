#!/usr/bin/env node
/*
  CommonJS version for ESM project
*/
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

const usersPath = getArg('users');
const hashAlgo = getArg('hash-algo');

if (!usersPath) {
  console.error('Provide --users=./data/users.json');
  process.exit(1);
}

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH environment variable to your service account JSON path');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(serviceAccountPath))) });
const auth = admin.auth();

(async function main() {
  try {
    const users = JSON.parse(fs.readFileSync(path.resolve(usersPath), 'utf8'));
    if (!Array.isArray(users)) throw new Error('users.json must be an array');

    // Determine if we have hashed passwords
    const hasHashes = users.some(u => u.passwordHash);

    if (hasHashes && hashAlgo) {
      console.log('Importing users with hashed passwords using algorithm', hashAlgo);

      // Map to ImportUserRecord format
      const records = users.map(u => {
        const rec = { uid: u.uid, email: u.email, emailVerified: !!u.emailVerified, displayName: u.displayName };
        if (u.passwordHash) rec.passwordHash = Buffer.from(u.passwordHash, 'base64');
        if (u.passwordSalt) rec.passwordSalt = Buffer.from(u.passwordSalt, 'base64');
        return rec;
      });

      const hash = (hashAlgo === 'BCRYPT') ? { algorithm: 'BCRYPT' } : (hashAlgo === 'SCRYPT') ? { algorithm: 'SCRYPT' } : null;
      if (!hash) throw new Error('Unsupported hash algorithm. Use BCRYPT or SCRYPT.');

      const result = await auth.importUsers(records, { hash });
      console.log('Import result:', result.errors && result.errors.length ? result.errors : 'No errors');
      process.exit(0);
    }

    console.log('Creating users without setting passwords (will print password reset links)');
    for (const u of users) {
      try {
        const created = await auth.createUser({ uid: u.uid, email: u.email, displayName: u.displayName, emailVerified: !!u.emailVerified });
        console.log('Created user:', created.uid);
        const link = await auth.generatePasswordResetLink(u.email);
        console.log('Password reset link for', u.email, link);
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          console.log('Email already exists, skipping:', u.email);
        } else {
          console.error('Error creating user', u.email, err);
        }
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Import users failed:', err);
    process.exit(1);
  }
})();
