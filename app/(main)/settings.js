import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ChevronLeft, Share2, Star, Mail, Shield, FileText, Trash2, LogOut, UserX } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { signOut, deleteAccount } from '../../lib/auth';
import { SPACING, RADIUS } from '../../constants/theme';

const CARD_BG  = '#1c1c1e';
const TEXT_PRI = '#ffffff';
const RED      = '#ef4444';
const ORANGE   = '#f97316';

function SettingRow({ label, icon, onPress, destructive = false, danger = false, disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelRed, danger && styles.rowLabelOrange]}>
        {label}
      </Text>
      {icon && <View style={styles.rowIcon}>{icon}</View>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [signingOut,      setSigningOut]      = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({ message: 'Meet SAVITA — your AI companion! Download now 💕' });
    } catch {}
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOutTitle'),
      t('settings.signOutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOutConfirm'),
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/(onboarding)/splash');
            } catch (err) {
              Alert.alert(t('common.error'), err.message ?? t('common.error'));
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await deleteAccount();
              router.replace('/(onboarding)/splash');
            } catch (err) {
              if (err.message === 'cancelled') {
                setDeletingAccount(false);
                return;
              }
              if (err.code === 'auth/requires-recent-login') {
                Alert.alert(t('settings.deleteAccountFailed'), t('settings.deleteAccountReauth'));
              } else {
                Alert.alert(t('settings.deleteAccountFailed'), err.message ?? t('common.error'));
              }
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      t('settings.deleteTitle'),
      t('settings.deleteMessage'),
      [
        { text: t('settings.deleteCancel'), style: 'cancel' },
        {
          text: t('settings.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
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
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      {/* ── Settings list ── */}
      <View style={styles.list}>

        <View style={styles.card}>
          <SettingRow
            label={t('settings.share')}
            icon={<Share2 color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={handleShare}
          />
        </View>

        <View style={styles.card}>
          <SettingRow
            label={t('settings.rate')}
            icon={<Star color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={() => Linking.openURL('market://details?id=com.savita8284.app')}
          />
        </View>

        <View style={styles.card}>
          <SettingRow
            label={t('settings.emailSupport')}
            icon={<Mail color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={() => Linking.openURL('mailto:support@savitaai.app?subject=Support%20Request')}
          />
        </View>

        <View style={styles.card}>
          <SettingRow
            label={t('settings.privacyPolicy')}
            icon={<Shield color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={() => Linking.openURL('https://savitaai.app/privacy')}
          />
        </View>

        <View style={styles.card}>
          <SettingRow
            label={t('settings.termsOfService')}
            icon={<FileText color={TEXT_PRI} size={18} strokeWidth={2} />}
            onPress={() => Linking.openURL('https://savitaai.app/terms')}
          />
        </View>

        {/* ── Sign Out ── */}
        <View style={[styles.card, styles.cardOrange]}>
          <SettingRow
            label={signingOut ? t('common.loading') : t('settings.signOut')}
            danger
            disabled={signingOut || deletingAccount}
            icon={<LogOut color={ORANGE} size={18} strokeWidth={2} />}
            onPress={handleSignOut}
          />
        </View>

        {/* ── Delete Account ── */}
        <View style={[styles.card, styles.cardRed]}>
          <SettingRow
            label={deletingAccount ? t('common.loading') : t('settings.deleteAccount')}
            destructive
            disabled={signingOut || deletingAccount}
            icon={<UserX color={RED} size={18} strokeWidth={2} />}
            onPress={handleDeleteAccount}
          />
        </View>

        {/* ── Delete local data only ── */}
        <View style={[styles.card, styles.cardRedDim]}>
          <SettingRow
            label={t('settings.deleteData')}
            destructive
            icon={<Trash2 color={RED} size={18} strokeWidth={2} />}
            onPress={handleDeleteData}
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: TEXT_PRI },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, gap: SPACING.sm },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS.md, overflow: 'hidden' },
  cardOrange: { borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)' },
  cardRed:    { borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  cardRedDim: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 18,
  },
  rowDisabled: { opacity: 0.4 },
  rowLabel:       { flex: 1, fontSize: 16, fontWeight: '600', color: TEXT_PRI },
  rowLabelRed:    { color: RED },
  rowLabelOrange: { color: ORANGE },
  rowIcon: { marginLeft: SPACING.sm },
});
