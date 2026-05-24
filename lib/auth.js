import { useEffect } from 'react';
import { Alert } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import useAppStore from '../store/useAppStore';

// Google Sign-In will be wired here when Firebase credentials are added to secrets.js.
// For now, the gateway uses guest mode.
export function useGoogleSignIn() {
  const handleGoogle = () => {
    Alert.alert(
      'Firebase Required',
      'Add your Firebase credentials to secrets.js to enable Google Sign-In.',
      [{ text: 'OK' }]
    );
  };
  return { request: null, promptAsync: handleGoogle };
}

export function useAuthListener() {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    if (!auth) return; // Firebase not configured — guest mode only
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid:         firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email:       firebaseUser.email,
              photoURL:    firebaseUser.photoURL,
            }
          : null
      );
    });
    return unsubscribe;
  }, []);
}
