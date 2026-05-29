import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Star, Settings } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { showPaywallAlways, checkPremiumStatus } from '../../lib/revenuecat';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user             = useAppStore((s) => s.user);
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const customName        = useAppStore((s) => s.customName);
  const resetCharacterFlow = useAppStore((s) => s.resetCharacterFlow);
  const setIsPremium       = useAppStore((s) => s.setIsPremium);
  const [paywallLoading, setPaywallLoading] = useState(false);

  const handleProBadge = async () => {
    if (paywallLoading) return;
    setPaywallLoading(true);
    try {
      const purchased = await showPaywallAlways();
      if (purchased) {
        setIsPremium(true);
      } else {
        const still = await checkPremiumStatus();
        setIsPremium(still);
      }
    } finally {
      setPaywallLoading(false);
    }
  };

  const userName    = user?.displayName ?? user?.email?.split('@')[0] ?? 'User';
  const displayName = customName?.trim() || selectedCharacter?.name;

  const companions = selectedCharacter
    ? [{
        id:          selectedCharacter.id,
        image:       selectedCharacter.image,
        name:        displayName,
        lastMessage: t('dashboard.openingMessage', { name: userName.split(' ')[0] }),
      }]
    : [];

  const handleSelectNew = () => {
    resetCharacterFlow();
    router.replace('/(character)/carousel');
  };

  const renderCompanion = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(main)/chat/${item.id}`)}
      activeOpacity={0.72}
    >
      <Image source={item.image} style={styles.avatar} />
      <View style={styles.rowInfo}>
        <Text style={styles.companionName}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={2}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.username}>{userName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.proBadge}
            onPress={handleProBadge}
            activeOpacity={0.85}
          >
            <Star color={COLORS.gold} size={13} fill={COLORS.gold} strokeWidth={0} />
            <Text style={styles.proText}>PRO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(main)/settings')}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings color={COLORS.textPrimary} size={22} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Companion list ── */}
      <FlatList
        data={companions}
        keyExtractor={(item) => item.id}
        renderItem={renderCompanion}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('dashboard.emptyText')}</Text>
            <Text style={styles.emptySub}>{t('dashboard.emptySub')}</Text>
          </View>
        }
      />

      {/* ── Fixed bottom ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md }]}>
        <TouchableOpacity style={styles.selectBtn} onPress={handleSelectNew} activeOpacity={0.88}>
          <Text style={styles.selectBtnText}>{t('dashboard.selectNew')}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  username: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  proText: { fontSize: 13, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.md,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  rowInfo: { flex: 1 },
  companionName: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  lastMessage: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.25)' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.15)' },
  bottomBar: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },
  selectBtn: { backgroundColor: '#ffffff', borderRadius: RADIUS.full, paddingVertical: 18, alignItems: 'center' },
  selectBtnText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.2 },
});
