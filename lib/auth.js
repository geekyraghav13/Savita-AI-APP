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

/**
 * Native Google Sign-In → Firebase credential
 * Returns the Firebase UserCredential on success.
 */
export async function googleSignIn() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type === 'cancelled') {
    throw new Error('cancelled');
  }

  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('No idToken returned from Google Sign-In');

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

/**
 * Firebase Anonymous Sign-In — no account required.
 */
export async function anonymousSignIn() {
  return signInAnonymously(auth);
}

/**
 * Listens for Firebase auth state changes and syncs to Zustand.
 * Mount once in the root layout.
 */
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
