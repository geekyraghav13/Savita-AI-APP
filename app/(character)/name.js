import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function NameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const setCustomName = useAppStore((s) => s.setCustomName);

  const [name, setName] = useState(selectedCharacter?.name ?? '');
  const [touched, setTouched] = useState(false);

  const isValid = name.trim().length >= 2;
  const showError = touched && !isValid;

  const handleContinue = () => {
    setTouched(true);
    if (!isValid) return;
    setCustomName(name.trim());
    router.push('/(character)/hobbies');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft color={COLORS.textSecondary} size={26} strokeWidth={2} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{t('name.title')}</Text>
          <Text style={styles.subtitle}>{t('name.subtitle')}</Text>

          {/* Gold underline input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => { setName(v); setTouched(false); }}
              placeholder={t('name.placeholder')}
              placeholderTextColor={COLORS.textSecondary}
              selectionColor={COLORS.gold}
              autoCorrect={false}
              maxLength={30}
            />
            <View style={[styles.underline, name.length > 0 && styles.underlineActive]} />
          </View>

          {showError && (
            <Text style={styles.error}>{t('name.error')}</Text>
          )}
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{t('name.continue')}</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  content: {
    flex: 1,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 40,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  inputWrap: {
    marginTop: SPACING.md,
  },
  input: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
  },
  underline: {
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  underlineActive: {
    backgroundColor: COLORS.gold,
  },
  error: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  btn: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
