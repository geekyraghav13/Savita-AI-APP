import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

// Placeholder — built properly on Day 8
export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.step}>Day 8</Text>
      <Text style={styles.title}>Unlock Premium</Text>
      <Text style={styles.sub}>Full paywall builds here on Day 8</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()} activeOpacity={0.85}>
        <Text style={styles.btnText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep, paddingHorizontal: SPACING.xl, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  step:  { fontSize: 12, color: COLORS.gold, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary },
  sub:   { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  btn:   { marginTop: SPACING.xl, backgroundColor: COLORS.purple, borderRadius: RADIUS.full, paddingVertical: 16, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
