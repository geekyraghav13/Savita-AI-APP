import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function InterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const setInterests      = useAppStore((s) => s.setInterests);
  const user              = useAppStore((s) => s.user);
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const [selected, setSelected] = useState([]);

  const tags = t('interests.tags', { returnObjects: true });
  const isValid = selected.length >= 1;

  const toggle = (tag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
    );
  };

  const handleContinue = () => {
    if (!isValid) return;
    setInterests(selected);
    if (user) {
      // Already authenticated — go straight to chat
      const chatId = selectedCharacter?.id;
      if (chatId) {
        router.replace(`/(main)/chat/${chatId}`);
      } else {
        router.replace('/(main)/dashboard');
      }
    } else {
      router.push('/(auth)/gateway');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <ChevronLeft color={COLORS.textSecondary} size={26} strokeWidth={2} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('interests.title')}</Text>
        <Text style={styles.subtitle}>{t('interests.subtitle')}</Text>
      </View>

      {/* Pills */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.pillGrid}
        showsVerticalScrollIndicator={false}
      >
        {Array.isArray(tags) && tags.map((tag, i) => {
          const active = selected.includes(tag);
          return (
            <TouchableOpacity
              key={i}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => toggle(tag)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue */}
      <TouchableOpacity
        style={[styles.btn, !isValid && styles.btnDisabled]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{t('interests.continue')}</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    paddingHorizontal: SPACING.xl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: SPACING.xl,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderColor: COLORS.purple,
  },
  pillText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: COLORS.purpleLight,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: SPACING.md,
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
