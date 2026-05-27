import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Star, Mail, Shield, FileText, Trash2 } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { SPACING, RADIUS } from '../../constants/theme';

const CARD_BG  = '#1c1c1e';
const TEXT_PRI = '#ffffff';
const TEXT_SEC = 'rgba(255,255,255,0.45)';
const RED      = '#ef4444';

function SettingRow({ label, icon, onPress, destructive = false, rightSlot }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelRed]}>{label}</Text>
      </View>
      {rightSlot ?? (icon ? (
        <View style={styles.rowIcon}>
          {icon}
        </View>
      ) : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const resetCharacterFlow = useAppStore((s) => s.resetCharacterFlow);
  const setUser            = useAppStore((s) => s.setUser);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Meet SAVITA — your AI companion! Download now 💕',
      });
    } catch {}
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@savitaai.app?subject=Support%20Request');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://savitaai.app/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://savitaai.app/terms');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete all data',
      'This will sign you out and reset all conversations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            resetCharacterFlow();
            setUser(null);
            router.replace('/(onboarding)/splash');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={TEXT_PRI} size={26} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* ── Settings list ── */}
      <View style={styles.list}>

        {/* Share */}
        <View style={styles.card}>
          <SettingRow
            label="Share SAVITA"
            icon={<Share2 color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={handleShare}
          />
        </View>

        {/* Rate */}
        <View style={styles.card}>
          <SettingRow
            label={'Like us, Rate us ❤️'}
            icon={<Star color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={() => Linking.openURL('market://details?id=com.savita8284.app')}
          />
        </View>

        {/* Email Support */}
        <View style={styles.card}>
          <SettingRow
            label="Email Support"
            icon={<Mail color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={handleEmail}
          />
        </View>

        {/* Privacy Policy */}
        <View style={styles.card}>
          <SettingRow
            label="Privacy Policy"
            icon={<Shield color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={handlePrivacy}
          />
        </View>

        {/* Terms of Service */}
        <View style={styles.card}>
          <SettingRow
            label="Terms of Service"
            icon={<FileText color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={handleTerms}
          />
        </View>

        {/* Delete all data */}
        <View style={[styles.card, styles.cardRed]}>
          <SettingRow
            label="Delete all data"
            destructive
            icon={<Trash2 color={RED} size={18} strokeWidth={2} />}
            onPress={handleDelete}
          />
        </View>

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
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.md,
    gap:               SPACING.md,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    fontSize:   22,
    fontWeight: '700',
    color:      TEXT_PRI,
  },
  // List
  list: {
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.md,
    gap:               SPACING.sm,
  },
  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius:    RADIUS.md,
    overflow:        'hidden',
  },
  cardRed: {
    borderWidth:  1,
    borderColor:  'rgba(239,68,68,0.25)',
  },
  // Row
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical:   18,
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontSize:   16,
    fontWeight: '600',
    color:      TEXT_PRI,
  },
  rowLabelRed: {
    color: RED,
  },
  rowIcon: {
    marginLeft: SPACING.sm,
  },
});
