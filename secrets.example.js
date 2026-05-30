// Copy this file to `secrets.js` and fill in your real values.
// `secrets.js` is gitignored and never committed.

// NOTE: Gemini API key is stored in Firebase Secret Manager (backend only).
// Run: firebase functions:secrets:set GEMINI_API_KEY
// It is NOT needed in this file — the app never touches it.

export const OPENROUTER_API_KEY = 'sk-or-v1-PUT-YOUR-OPENROUTER-KEY-HERE';

export const FIREBASE_CONFIG = {
  apiKey:            'YOUR_FIREBASE_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

export const REVENUECAT_ANDROID_KEY = 'YOUR_REVENUECAT_KEY';
export const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
