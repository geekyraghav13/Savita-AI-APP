import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../lib/i18n';
import useAppStore from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
];

const CARD = (width - SPACING.xl * 2 - SPACING.md * 2) / 3;

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [selected, setSelected] = useState('en');

  const handleContinue = async () => {
    setLanguage(selected);
    i18n.changeLanguage(selected);
    // Mark onboarding complete so splash skips this flow on next launch
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/(character)/carousel');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl, paddingTop: insets.top + SPACING.lg }]}>

      <View style={styles.header}>
        <Text style={styles.title}>Choose Language</Text>
        <Text style={styles.sub}>You can change this later in settings</Text>
      </View>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(l) => l.code}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const active = item.code === selected;
          return (
            <TouchableOpacity
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(item.code)}
              activeOpacity={0.75}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[styles.langName, active && styles.langNameActive]}>
                {item.name}
              </Text>
              {active && <View style={styles.checkDot} />}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.btnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  grid: {
    gap: SPACING.md,
  },
  row: {
    gap: SPACING.md,
  },
  card: {
    width: CARD,
    height: CARD,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  cardActive: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.bgCard,
  },
  flag: {
    fontSize: 28,
  },
  langName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  langNameActive: {
    color: COLORS.purpleLight,
    fontWeight: '700',
  },
  checkDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.purple,
  },
  btn: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
