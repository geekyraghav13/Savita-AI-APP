import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../secrets';

// Returns null if config is still placeholder — app works in guest-only mode until configured
const isConfigured = FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

let auth = null;
let db   = null;

if (isConfigured) {
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
  auth = getAuth(app);
  db   = getFirestore(app);
}

export { auth, db };
