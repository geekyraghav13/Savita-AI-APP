import '../lib/i18n';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthListener } from '../lib/auth';
import { initRevenueCat, checkPremiumStatus } from '../lib/revenuecat';
import { registerPushToken } from '../lib/notifications';
import { refreshUserSession } from '../lib/firestore';
import useAppStore from '../store/useAppStore';

function AppGate() {
  useAuthListener();
  const setIsPremium = useAppStore((s) => s.setIsPremium);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    initRevenueCat(user?.uid ?? null);
    checkPremiumStatus().then(setIsPremium);
  }, []);

  // Re-check premium + register FCM token + refresh TTL whenever auth user changes
  useEffect(() => {
    if (user?.uid) {
      checkPremiumStatus().then(setIsPremium);
      refreshUserSession(user.uid);
      // Small delay so the auth state fully settles before requesting permission
      const t = setTimeout(() => registerPushToken(user.uid), 2000);
      return () => clearTimeout(t);
    }
  }, [user?.uid]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppGate />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
