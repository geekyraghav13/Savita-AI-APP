import '../lib/i18n';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthListener } from '../lib/auth';
import { initRevenueCat, checkPremiumStatus } from '../lib/revenuecat';
import useAppStore from '../store/useAppStore';

function AppGate() {
  useAuthListener();
  const setIsPremium = useAppStore((s) => s.setIsPremium);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    initRevenueCat(user?.uid ?? null);
    checkPremiumStatus().then(setIsPremium);
  }, []);

  // Re-check premium whenever auth user changes (login/logout)
  useEffect(() => {
    if (user?.uid) {
      checkPremiumStatus().then(setIsPremium);
    }
  }, [user?.uid]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppGate />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
