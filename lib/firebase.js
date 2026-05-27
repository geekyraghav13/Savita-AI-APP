import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../secrets';

const isConfigured = FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

let auth = null;
let db   = null;

if (isConfigured) {
  const app = getApps().length === 0
    ? initializeApp(FIREBASE_CONFIG)
    : getApp();

  // Use React Native AsyncStorage so auth token survives app restarts.
  // initializeAuth throws if called twice — fall back to getAuth() in that case.
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }

  db = getFirestore(app);
}

export { auth, db };
