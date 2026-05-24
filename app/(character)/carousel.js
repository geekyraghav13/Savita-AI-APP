import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

// Placeholder — built properly on Day 4
export default function CarouselScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>
      <View style={styles.top}>
        <Text style={styles.step}>Day 4</Text>
        <Text style={styles.title}>Choose Your{'\n'}Companion</Text>
        <Text style={styles.sub}>Character carousel builds here</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/(character)/name')}>
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
