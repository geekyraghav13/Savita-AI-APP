import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, Settings } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user              = useAppStore((s) => s.user);
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const customName        = useAppStore((s) => s.customName);
  const resetCharacterFlow = useAppStore((s) => s.resetCharacterFlow);

  const userName    = user?.displayName ?? user?.email?.split('@')[0] ?? 'User';
  const displayName = customName?.trim() || selectedCharacter?.name;

  // Companion list — only the current session companion for now (Firestore history in Day 9)
  const companions = selectedCharacter
    ? [
        {
          id:          selectedCharacter.id,
          image:       selectedCharacter.image,
          name:        displayName,
          lastMessage: `Hey ${userName.split(' ')[0]}! 💕 I've been waiting for you. What's on your mind today?`,
        },
      ]
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
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.username}>{userName}</Text>

        <View style={styles.headerRight}>
          {/* PRO badge → paywall */}
          <TouchableOpacity
            style={styles.proBadge}
            onPress={() => router.push('/(main)/paywall')}
            activeOpacity={0.85}
          >
            <Star color={COLORS.gold} size={13} fill={COLORS.gold} strokeWidth={0} />
            <Text style={styles.proText}>PRO</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            onPress={() => router.push('/(main)/settings')}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings color={COLORS.textPrimary} size={22} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Divider ── */}
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
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySub}>Select a girlfriend to start chatting</Text>
          </View>
        }
      />

      {/* ── Fixed bottom: Select New Girlfriend ── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md },
        ]}
      >
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={handleSelectNew}
          activeOpacity={0.88}
        >
          <Text style={styles.selectBtnText}>Select New Girlfriend</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#000000',
  },
  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.md,
  },
  username: {
    fontSize:   28,
    fontWeight: '800',
    color:      '#ffffff',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
  },
  proBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    borderWidth:     1.5,
    borderColor:     COLORS.gold,
    borderRadius:    RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical:    5,
  },
  proText: {
    fontSize:      13,
    fontWeight:    '700',
    color:         COLORS.gold,
    letterSpacing: 0.5,
  },
  // Divider
  divider: {
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  // Companion row
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.md,
    gap:               SPACING.md,
  },
  avatar: {
    width:        60,
    height:       60,
    borderRadius: 30,
    borderWidth:  1.5,
    borderColor:  'rgba(255,255,255,0.15)',
  },
  rowInfo: {
    flex: 1,
  },
  companionName: {
    fontSize:     18,
    fontWeight:   '700',
    color:        '#ffffff',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize:   13,
    color:      'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  // Empty state
  empty: {
    alignItems:  'center',
    paddingTop:  80,
    gap:         SPACING.sm,
  },
  emptyText: {
    fontSize:   16,
    fontWeight: '600',
    color:      'rgba(255,255,255,0.25)',
  },
  emptySub: {
    fontSize: 13,
    color:    'rgba(255,255,255,0.15)',
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.md,
  },
  selectBtn: {
    backgroundColor: '#ffffff',
    borderRadius:    RADIUS.full,
    paddingVertical: 18,
    alignItems:      'center',
  },
  selectBtnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#000000',
    letterSpacing: 0.2,
  },
});
