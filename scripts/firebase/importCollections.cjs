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

const profilesPath = getArg('profiles');
const rolesPath = getArg('roles');

if (!profilesPath && !rolesPath) {
  console.error('Provide at least one of --profiles or --roles');
  process.exit(1);
}

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH environment variable to your service account JSON path');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
});

const db = admin.firestore();

async function importFile(filePath, collectionName, idField = 'id') {
  const data = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  if (!Array.isArray(data)) {
    throw new Error(`${filePath} must be a JSON array`);
  }

  console.log(`Importing ${data.length} documents to '${collectionName}'`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = data.slice(i, i + BATCH_SIZE);
    chunk.forEach((doc) => {
      const docId = doc[idField] || undefined;
      const ref = docId ? db.collection(collectionName).doc(String(docId)) : db.collection(collectionName).doc();
      const payload = Object.assign({}, doc);
      // Remove id field if present
      delete payload[idField];
      batch.set(ref, payload, { merge: true });
    });
    await batch.commit();
    console.log(`Committed ${Math.min(i + BATCH_SIZE, data.length)} / ${data.length}`);
  }

  console.log('Import finished for', collectionName);
}

(async function main() {
  try {
    if (profilesPath) await importFile(profilesPath, 'profiles', 'id');
    if (rolesPath) await importFile(rolesPath, 'user_roles', 'id');
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
})();
