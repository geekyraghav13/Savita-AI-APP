import { useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';
import { GOOGLE_WEB_CLIENT_ID } from '../secrets';
import useAppStore from '../store/useAppStore';

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

// ── Google Sign-In ────────────────────────────────────────────────────────────
export async function googleSignIn() {
  if (!auth) {
    throw new Error('Firebase is not configured. Add credentials to secrets.js.');
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type === 'cancelled') {
    throw new Error('cancelled');
  }

  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('No ID token returned from Google Sign-In');

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

// ── Anonymous / Guest Sign-In ─────────────────────────────────────────────────
// Falls back to a local guest session if:
//   • Firebase is not configured (auth === null)
//   • Anonymous auth is disabled in Firebase Console
export async function anonymousSignIn() {
  if (!auth) {
    return _localGuestFallback();
  }
  try {
    return await signInAnonymously(auth);
  } catch (err) {
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/configuration-not-found'
    ) {
      // Anonymous auth not enabled in Firebase Console — use local guest
      return _localGuestFallback();
    }
    throw err;
  }
}

function _localGuestFallback() {
  const guestUser = {
    uid:         'guest_' + Date.now(),
    displayName: 'Guest',
    email:       null,
    photoURL:    null,
    isAnonymous: true,
  };
  // Update Zustand directly (outside a React component — valid in Zustand)
  useAppStore.getState().setUser(guestUser);
  return guestUser;
}

// ── Auth state listener ───────────────────────────────────────────────────────
// Mount once in root _layout.js. Syncs Firebase user → Zustand on every change.
export function useAuthListener() {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid:         firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email:       firebaseUser.email,
          photoURL:    firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);
}
