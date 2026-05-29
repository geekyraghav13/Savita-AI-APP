import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { googleSignIn, anonymousSignIn } from '../../lib/auth';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import useAppStore from '../../store/useAppStore';

export default function GatewayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);

  const selectedCharacter = useAppStore((s) => s.selectedCharacter);

  // After sign-in, go straight to chat if a character is selected
  const afterSignIn = () => {
    if (selectedCharacter?.id) {
      router.replace(`/(main)/chat/${selectedCharacter.id}`);
    } else {
      router.replace('/(main)/dashboard');
    }
  };

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      await googleSignIn();
      afterSignIn();
    } catch (err) {
      if (err.message !== 'cancelled') {
        Alert.alert(t('auth.signInFailed'), err.message ?? t('common.error'));
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAnonymous = async () => {
    setLoadingAnon(true);
    try {
      await anonymousSignIn();
      afterSignIn();
    } catch (err) {
      Alert.alert(t('auth.signInFailed'), err.message ?? t('common.error'));
    } finally {
      setLoadingAnon(false);
    }
  };

  const isLoading = loadingGoogle || loadingAnon;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl, paddingTop: insets.top + SPACING.xl }]}>

      {/* Branding */}
      <View style={styles.top}>
        <Text style={styles.logo}>SAVITA</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.bottom}>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={[styles.googleBtn, isLoading && styles.dimmed]}
          onPress={handleGoogle}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#333" size="small" />
          ) : (
            <>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleLabel}>{t('auth.google')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Anonymous Sign-In */}
        <TouchableOpacity
          style={[styles.anonBtn, isLoading && styles.dimmed]}
          onPress={handleAnonymous}
          disabled={isLoading}
          activeOpacity={0.75}
        >
          {loadingAnon ? (
            <ActivityIndicator color={COLORS.textSecondary} size="small" />
          ) : (
            <Text style={styles.anonLabel}>{t('auth.guest')}</Text>
          )}
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
  anonBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  anonLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dimmed: {
    opacity: 0.45,
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
  },
});
