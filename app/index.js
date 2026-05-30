import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';

export default function Root() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    let settled = false;

    const resolve = async (user) => {
      if (settled) return;
      settled = true;

      if (user) {
        setDestination('/(main)/dashboard');
        return;
      }

      const onboarded = await AsyncStorage.getItem('onboarded');
      setDestination(onboarded ? '/(auth)/gateway' : '/(onboarding)/splash');
    };

    const timeout = setTimeout(() => resolve(null), 3000);

    const unsubscribe = auth
      ? onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout);
          resolve(user);
        })
      : (() => { resolve(null); return () => {}; })();

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08001a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#9d4edd" size="large" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
