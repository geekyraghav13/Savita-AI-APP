import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// ── Generate 3 retention notifications via secure Cloud Function ──────────────
// The Gemini API key lives in Firebase Secret Manager — never in this app or APK.
// The Cloud Function verifies auth (request.auth.uid === uid) before calling Gemini.
export async function generateRetentionNotifications(uid, characterName, lastMessages, userName) {
  if (!uid || !lastMessages?.length) return;

  try {
    const functions = getFunctions(getApp(), 'us-central1');
    const generate  = httpsCallable(functions, 'generateNotifications');

    await generate({ uid, characterName, lastMessages, userName });
    // Result (pendingNotifications) is saved to Firestore directly by the function.
    // The scheduled sender reads it from there at send time.
  } catch (err) {
    // Non-blocking — scheduled function will use fallback templates if this fails
    console.warn('[Gemini] Cloud Function call failed:', err.message);
  }
}
