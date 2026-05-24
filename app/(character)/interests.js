import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import useAppStore from '../../store/useAppStore';

// Placeholder — built properly on Day 5
// Identity check lives here: authenticated users skip the gateway
export default function InterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const handleContinue = () => {
    if (user) {
      // Already authenticated — skip gateway, go straight to summary (Day 6)
      router.replace('/(main)/dashboard');
    } else {
      // Not authenticated — show sign-in gateway
      router.push('/(auth)/gateway');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>
      <View style={styles.top}>
        <Text style={styles.step}>Day 5</Text>
        <Text style={styles.title}>Her Interests</Text>
        <Text style={styles.sub}>Interests pills build here</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleContinue}>
        <Text style={styles.btnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bgDeep, paddingHorizontal: SPACING.xl, justifyContent: 'space-between', paddingTop: 80 },
  top:        { gap: SPACING.sm },
  step:       { fontSize: 12, color: COLORS.purple, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  title:      { fontSize: 36, fontWeight: 'bold', color: COLORS.textPrimary, lineHeight: 44 },
  sub:        { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm },
  btn:        { backgroundColor: COLORS.purple, borderRadius: RADIUS.full, paddingVertical: 18, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
