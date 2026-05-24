import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useGoogleSignIn } from '../../lib/auth';
import useAppStore from '../../store/useAppStore';

export default function GatewayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const { request, promptAsync } = useGoogleSignIn();
  const [loading, setLoading] = useState(false);

  // Firebase auth state or guest mode resolved → move to summary (Day 6: replace with summary)
  useEffect(() => {
    if (user) router.replace('/(main)/dashboard');
  }, [user]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setUser({ uid: 'guest', displayName: 'Guest', email: null, photoURL: null, isGuest: true });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>

      <View style={styles.top}>
        <Text style={styles.logo}>SAVITA</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      <View style={styles.bottom}>
        {/* Google Sign-In — active when Firebase is configured */}
        <TouchableOpacity
          style={[styles.googleBtn, (!request || loading) && styles.dimmed]}
          onPress={handleGoogle}
          disabled={!request || loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#333" size="small" />
          ) : (
            <>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleLabel}>{t('auth.google')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Guest mode — always works */}
        <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.75}>
          <Text style={styles.guestLabel}>{t('auth.guest')}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>{t('auth.note')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 10,
  },
  divider: {
    width: 40,
    height: 1.5,
    backgroundColor: COLORS.gold,
    opacity: 0.4,
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottom: {
    gap: SPACING.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    gap: SPACING.sm,
  },
  dimmed: { opacity: 0.45 },
  googleG: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  guestBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
  },
});
