import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { showPaywall, checkPremiumStatus } from '../../lib/revenuecat';
import useAppStore from '../../store/useAppStore';

// All paywall entry points now call showPaywall() directly.
// This screen exists as a safe fallback for any deep-link or legacy navigation.
export default function PaywallScreen() {
  const router       = useRouter();
  const setIsPremium = useAppStore((s) => s.setIsPremium);

  useEffect(() => {
    (async () => {
      const purchased = await showPaywall();
      if (purchased) {
        setIsPremium(true);
      } else {
        const still = await checkPremiumStatus();
        setIsPremium(still);
      }
      router.back();
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );
}
