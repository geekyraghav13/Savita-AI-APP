import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

// Placeholder — built properly on Day 5
export default function HobbiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>
      <View style={styles.top}>
        <Text style={styles.step}>Day 5</Text>
        <Text style={styles.title}>Her Hobbies</Text>
        <Text style={styles.sub}>Hobby pills build here</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/(character)/interests')}>
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
