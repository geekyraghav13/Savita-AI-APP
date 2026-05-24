import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import useAppStore from '../../store/useAppStore';

// Placeholder — built properly on Day 9
export default function DashboardScreen() {
  const user = useAppStore((s) => s.user);
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SAVITA</Text>
      <Text style={styles.text}>Signed in as</Text>
      <Text style={styles.email}>{user?.displayName ?? user?.email ?? 'Guest'}</Text>
      <Text style={styles.note}>Day 9 will build this screen fully.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 8,
    marginBottom: SPACING.xl,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  email: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.xl,
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.5,
  },
});
