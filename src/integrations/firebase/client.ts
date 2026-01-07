// Firebase client (modular SDK) - do not commit service account keys
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOZOM6-dNokue_tVitqWI2K9afDgXUKVw",
  authDomain: "espaconave-ec53b.firebaseapp.com",
  projectId: "espaconave-ec53b",
  storageBucket: "espaconave-ec53b.firebasestorage.app",
  messagingSenderId: "325210521630",
  appId: "1:325210521630:web:4362c1db65c6172b4d2e0f",
  measurementId: "G-DRPNFRZ5RJ"
};
// Initialize Firebase app (safe for HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in the browser and if measurementId is set
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  import('firebase/analytics').then(({ getAnalytics }) => {
    try {
      getAnalytics(app);
    } catch (e) {
      // ignore analytics errors in non-supported environments
      // console.warn('Analytics init failed', e);
    }
  });
}

export default app;
