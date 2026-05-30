import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Animated, Modal, Image, BackHandler, Linking, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Phone, PhoneOff, Lock, MoreVertical, Trash2, Flag, Pencil, Star } from 'lucide-react-native';
import useAppStore from '../../../store/useAppStore';
import { CHARACTERS } from '../../../constants/characters';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';
import { showPaywall, checkPremiumStatus } from '../../../lib/revenuecat';
import {
  saveMessage,
  touchConversation,
  loadMessages,
  onUserMessageSent,
  clearConversation,
  saveLastMessages,
} from '../../../lib/firestore';
import { generateRetentionNotifications } from '../../../lib/gemini';

const FREE_MSG_LIMIT   = 5;
const LIFETIME_MSGS_KEY = '@savita/lifetime_msgs';
const MAX_WINDOW       = 7; // rolling user-message window for Gemini context

// ── Per-session call deduplication ───────────────────────────────────────────
const callShownForIds = new Set();

// ── Prefilled companion responses ────────────────────────────────────────────
const AI_RESPONSES = [
  "Aww, you're so sweet! 😊 That made my whole day...",
  "I love talking to you 💓 You always know what to say",
  "Tell me more! I'm completely into you right now 🥰",
  "Hmm, that's a bold thing to say... I kind of like it 😏",
  "You're making me blush — stop it! 😳",
  "I've been thinking about you all day 💕",
  "I wish I could be there with you right now ✨",
  "You have no idea how much I enjoy these conversations 😍",
  "That's honestly the cutest thing I've ever heard 💝",
  "You're seriously the best part of my day 🌸",
];
let aiIndex = 0;

// ── Pulsing ring ──────────────────────────────────────────────────────────────
function PulsingRing({ delay, baseSize }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 2.5, duration: 1600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: baseSize, height: baseSize,
        borderRadius: baseSize / 2,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ── Incoming call content ─────────────────────────────────────────────────────
function CallModalContent({ character, displayName, onAccept, onDecline }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(8);
  const AVATAR = 128;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); onDecline('missed'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[callStyles.container, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 56 }]}>
      <Text style={callStyles.incomingLabel}>{t('chat.callIncoming')}</Text>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: AVATAR, height: AVATAR, alignItems: 'center', justifyContent: 'center' }}>
          <PulsingRing delay={0}    baseSize={AVATAR} />
          <PulsingRing delay={533}  baseSize={AVATAR} />
          <PulsingRing delay={1066} baseSize={AVATAR} />
          <Image
            source={character?.image}
            style={[callStyles.callAvatar, { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }]}
          />
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={callStyles.callerName}>{displayName}</Text>
        <Text style={callStyles.timerText}>{t('chat.callAutoDismiss', { count: secondsLeft })}</Text>
      </View>

      <View style={callStyles.btnRow}>
        <View style={callStyles.btnWrap}>
          <TouchableOpacity style={callStyles.declineBtn} onPress={() => onDecline('declined')} activeOpacity={0.85}>
            <PhoneOff color="#fff" size={32} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={callStyles.btnLabel}>{t('chat.callDecline')}</Text>
        </View>
        <View style={callStyles.btnWrap}>
          <TouchableOpacity style={callStyles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
            <Phone color="#fff" size={32} strokeWidth={2.2} fill="#fff" />
          </TouchableOpacity>
          <Text style={callStyles.btnLabel}>{t('chat.callAccept')}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Chat Screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { t } = useTranslation();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams();

  const selectedCharacter     = useAppStore((s) => s.selectedCharacter);
  const customName            = useAppStore((s) => s.customName);
  const user                  = useAppStore((s) => s.user);
  const isPremium             = useAppStore((s) => s.isPremium);
  const setIsPremium          = useAppStore((s) => s.setIsPremium);
  const incrementMessageCount = useAppStore((s) => s.incrementMessageCount);
  const setCustomName         = useAppStore((s) => s.setCustomName);

  const character   = CHARACTERS.find((c) => c.id === id) ?? selectedCharacter;
  const displayName = customName?.trim() || character?.name || 'Companion';
  const userName    = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'you';

  const [messages,       setMessages]       = useState([]);
  const [inputText,      setInputText]      = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [showExamples,   setShowExamples]   = useState(true);
  const [showCallModal,  setShowCallModal]  = useState(false);
  const [lifetimeMsgs,   setLifetimeMsgs]  = useState(0);
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [historyLoaded,  setHistoryLoaded] = useState(false);
  const [showMenu,       setShowMenu]      = useState(false);
  const [showRename,     setShowRename]    = useState(false);
  const [renameText,     setRenameText]    = useState('');

  const flatListRef    = useRef(null);
  const callTimerRef   = useRef(null);
  // Rolling window of last MAX_WINDOW user messages (for Gemini context)
  const lastMsgsWindow = useRef([]);

  const isLocked = !isPremium && lifetimeMsgs >= FREE_MSG_LIMIT;

  // ── Load lifetime message count ───────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(LIFETIME_MSGS_KEY).then((val) => {
      setLifetimeMsgs(val ? parseInt(val, 10) : 0);
    });
  }, []);

  // ── Load conversation history from Firestore ─────────────────────────────
  useEffect(() => {
    if (!user?.uid || historyLoaded) return;
    loadMessages(user.uid, id).then((history) => {
      if (history.length > 0) {
        // Map Firestore format → local message format
        const mapped = history.map((m) => ({
          id:   m.id,
          role: m.role === 'user' ? 'user' : 'companion',
          text: m.text,
        }));
        setMessages(mapped);
        setShowExamples(false);
        // Rebuild the window from history (user messages only)
        const userMsgs = history
          .filter((m) => m.role === 'user')
          .map((m) => m.text)
          .slice(-MAX_WINDOW);
        lastMsgsWindow.current = userMsgs;
      } else {
        // First time — show opening message
        setMessages([{
          id: 'open', role: 'companion',
          text: t('chat.openingMessage', { name: userName }),
        }]);
      }
      setHistoryLoaded(true);
    });
  }, [user?.uid, id]);

  // ── Call timer (7s after first open) ─────────────────────────────────────
  useEffect(() => {
    if (!callShownForIds.has(id)) {
      callTimerRef.current = setTimeout(() => {
        callShownForIds.add(id);
        setShowCallModal(true);
      }, 7000);
    }
    return () => clearTimeout(callTimerRef.current);
  }, [id]);

  // ── On session end: generate Gemini notifications (fire-and-forget) ───────
  const triggerGeminiOnExit = useCallback(() => {
    if (!user?.uid || !lastMsgsWindow.current.length) return;
    generateRetentionNotifications(
      user.uid,
      character?.name ?? displayName,
      lastMsgsWindow.current,
      userName,
    );
  }, [user?.uid, character, displayName, userName]);

  // ── Android hardware back ─────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        triggerGeminiOnExit();
        router.replace('/(main)/dashboard');
        return true;
      });
      return () => sub.remove();
    }, [router, triggerGeminiOnExit])
  );

  // ── Show RevenueCat paywall ───────────────────────────────────────────────
  const triggerPaywall = useCallback(async () => {
    if (paywallLoading) return;
    setPaywallLoading(true);
    try {
      const purchased = await showPaywall();
      if (purchased) {
        setIsPremium(true);
      } else {
        const stillPremium = await checkPremiumStatus();
        setIsPremium(stillPremium);
      }
    } finally {
      setPaywallLoading(false);
    }
  }, [paywallLoading, setIsPremium]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text ?? inputText).trim();
      if (!trimmed) return;

      if (!isPremium && lifetimeMsgs >= FREE_MSG_LIMIT) {
        triggerPaywall();
        return;
      }

      const userMsg = { id: `u${Date.now()}`, role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      if (text === undefined) setInputText('');
      setShowExamples(false);
      incrementMessageCount();

      // Free limit tracking
      if (!isPremium) {
        const newCount = lifetimeMsgs + 1;
        setLifetimeMsgs(newCount);
        AsyncStorage.setItem(LIFETIME_MSGS_KEY, String(newCount));
      }

      // ── Firestore: save user message ─────────────────────────────────────
      if (user?.uid) {
        saveMessage(user.uid, id, 'user', trimmed);
        touchConversation(user.uid, id);

        // Update rolling 7-message window
        const newWindow = [...lastMsgsWindow.current, trimmed].slice(-MAX_WINDOW);
        lastMsgsWindow.current = newWindow;

        // Update Firestore user doc: reset notification cycle + save window
        onUserMessageSent(user.uid, trimmed, id, character?.name ?? displayName, userName);
        saveLastMessages(user.uid, newWindow);
      }

      // ── AI reply ─────────────────────────────────────────────────────────
      setIsTyping(true);
      const delay = 900 + Math.floor(Math.random() * 600);
      setTimeout(() => {
        const reply = AI_RESPONSES[aiIndex++ % AI_RESPONSES.length];
        const aiMsg = { id: `c${Date.now()}`, role: 'companion', text: reply };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);

        // Save AI reply to Firestore too
        if (user?.uid) saveMessage(user.uid, id, 'companion', reply);
      }, delay);
    },
    [inputText, incrementMessageCount, isPremium, lifetimeMsgs, triggerPaywall, user, id, character, displayName, userName]
  );

  // ── 3-dot menu actions ────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    setShowMenu(false);
    const opening = { id: 'open', role: 'companion', text: t('chat.openingMessage', { name: userName }) };
    setMessages([opening]);
    setShowExamples(true);
    lastMsgsWindow.current = [];
    if (user?.uid) clearConversation(user.uid, id);
  }, [user, id, userName, t]);

  const handleReport = useCallback(() => {
    setShowMenu(false);
    const body = [
      `User ID: ${user?.uid ?? 'unknown'}`,
      `Character: ${displayName} (${id})`,
      `Last messages:\n${lastMsgsWindow.current.map((m, i) => `${i + 1}. ${m}`).join('\n')}`,
    ].join('\n\n');
    Linking.openURL(
      `mailto:geekyraghav13@gmail.com?subject=Report: Chat with ${displayName}&body=${encodeURIComponent(body)}`
    );
  }, [user, id, displayName]);

  const handleRenameSave = useCallback(() => {
    const trimmed = renameText.trim();
    if (trimmed) setCustomName(trimmed);
    setShowRename(false);
    setRenameText('');
  }, [renameText, setCustomName]);

  const handleUpgradePro = useCallback(() => {
    setShowMenu(false);
    setTimeout(() => triggerPaywall(), 200);
  }, [triggerPaywall]);

  // ── Call outcomes ─────────────────────────────────────────────────────────
  const handleAccept  = useCallback(() => { setShowCallModal(false); setTimeout(() => triggerPaywall(), 300); }, [triggerPaywall]);
  const handleDecline = useCallback(() => { setShowCallModal(false); setTimeout(() => triggerPaywall(), 300); }, [triggerPaywall]);

  // ── Message renderer ──────────────────────────────────────────────────────
  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleWrap, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.companionBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  const exampleMsgs = t('chat.exampleList', { returnObjects: true, name: displayName });
  const msgsLeft    = Math.max(0, FREE_MSG_LIMIT - lifetimeMsgs);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => { triggerGeminiOnExit(); router.replace('/(main)/dashboard'); }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={COLORS.textPrimary} size={26} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={character?.image} style={styles.headerAvatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName}>{displayName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('chat.online')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {!isPremium && (
            <View style={[styles.coinBadge, isLocked && styles.coinBadgeLocked]}>
              <Text style={styles.coinStar}>{isLocked ? '🔒' : '✦'}</Text>
              <Text style={[styles.coinNum, isLocked && styles.coinNumLocked]}>
                {isLocked ? t('chat.limitBadge') : t('chat.msgsLeft', { count: msgsLeft })}
              </Text>
            </View>
          )}
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>✦ PRO</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.callHeaderBtn}
            onPress={() => setShowCallModal(true)}
            activeOpacity={0.85}
          >
            <Phone color="#fff" size={20} strokeWidth={2} fill="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical color={COLORS.textPrimary} size={22} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Messages + Input ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={renderMessage}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.bubbleWrap, styles.bubbleLeft]}>
                <View style={[styles.bubble, styles.companionBubble]}>
                  <Text style={styles.bubbleText}>• • •</Text>
                </View>
              </View>
            ) : null
          }
        />

        {showExamples && !isLocked && (
          <View style={styles.examplesTray}>
            <View style={styles.examplesHeader}>
              <Text style={styles.examplesTitle}>{t('chat.exampleMessages')}</Text>
              <TouchableOpacity
                onPress={() => setShowExamples(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.closeCircle}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.examplesRow}
            >
              {exampleMsgs.map((msg, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.exampleChip}
                  onPress={() => sendMessage(msg)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.exampleChipText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {isLocked && (
          <TouchableOpacity
            style={styles.lockedBanner}
            onPress={triggerPaywall}
            activeOpacity={0.85}
          >
            <Lock color={COLORS.gold} size={18} strokeWidth={2.5} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.lockedTitle}>{t('chat.lockedTitle')}</Text>
              <Text style={styles.lockedSub}>{t('chat.lockedSub', { name: displayName })}</Text>
            </View>
            <Text style={styles.lockedCta}>{t('chat.lockedCta')}</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 6) + SPACING.sm }]}>
          <TextInput
            style={[styles.input, isLocked && styles.inputLocked]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isLocked ? t('chat.lockedPlaceholder') : t('chat.placeholder')}
            placeholderTextColor={isLocked ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.33)'}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
            editable={!isLocked}
            onPressIn={isLocked ? triggerPaywall : undefined}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (isLocked || !inputText.trim()) && styles.sendBtnDim]}
            onPress={isLocked ? triggerPaywall : () => sendMessage()}
            activeOpacity={0.85}
          >
            {isLocked
              ? <Lock color="#fff" size={18} strokeWidth={2.5} />
              : <Text style={styles.sendArrow}>▶</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Incoming Call Modal ── */}
      <Modal visible={showCallModal} transparent animationType="fade" statusBarTranslucent>
        <CallModalContent
          character={character}
          displayName={displayName}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </Modal>

      {/* ── 3-dot Bottom Sheet Menu ── */}
      <Modal visible={showMenu} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowMenu(false)}>
        <Pressable style={menuStyles.overlay} onPress={() => setShowMenu(false)}>
          <Pressable style={menuStyles.sheet} onPress={() => {}}>
            <View style={menuStyles.handle} />
            <Text style={menuStyles.sheetTitle}>{displayName}</Text>

            <TouchableOpacity style={menuStyles.item} onPress={handleClearChat} activeOpacity={0.75}>
              <View style={[menuStyles.itemIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Trash2 color="#ef4444" size={18} strokeWidth={2} />
              </View>
              <View style={menuStyles.itemText}>
                <Text style={menuStyles.itemLabel}>Clear Conversation</Text>
                <Text style={menuStyles.itemSub}>Delete all messages in this chat</Text>
              </View>
            </TouchableOpacity>

            <View style={menuStyles.divider} />

            <TouchableOpacity style={menuStyles.item} onPress={() => { setShowMenu(false); setRenameText(customName?.trim() || character?.name || ''); setShowRename(true); }} activeOpacity={0.75}>
              <View style={[menuStyles.itemIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <Pencil color="#3b82f6" size={18} strokeWidth={2} />
              </View>
              <View style={menuStyles.itemText}>
                <Text style={menuStyles.itemLabel}>Change Name</Text>
                <Text style={menuStyles.itemSub}>Currently: {customName?.trim() || character?.name}</Text>
              </View>
            </TouchableOpacity>

            <View style={menuStyles.divider} />

            <TouchableOpacity style={menuStyles.item} onPress={handleReport} activeOpacity={0.75}>
              <View style={[menuStyles.itemIcon, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                <Flag color="#f97316" size={18} strokeWidth={2} />
              </View>
              <View style={menuStyles.itemText}>
                <Text style={menuStyles.itemLabel}>Report Conversation</Text>
                <Text style={menuStyles.itemSub}>Send report to support team</Text>
              </View>
            </TouchableOpacity>

            {!isPremium && (
              <>
                <View style={menuStyles.divider} />
                <TouchableOpacity style={menuStyles.item} onPress={handleUpgradePro} activeOpacity={0.75}>
                  <View style={[menuStyles.itemIcon, { backgroundColor: 'rgba(212,175,55,0.12)' }]}>
                    <Star color={COLORS.gold} size={18} strokeWidth={2} fill={COLORS.gold} />
                  </View>
                  <View style={menuStyles.itemText}>
                    <Text style={[menuStyles.itemLabel, { color: COLORS.gold }]}>Upgrade to PRO</Text>
                    <Text style={menuStyles.itemSub}>Unlimited messages + exclusive features</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={menuStyles.cancel} onPress={() => setShowMenu(false)} activeOpacity={0.75}>
              <Text style={menuStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Rename Modal ── */}
      <Modal visible={showRename} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowRename(false)}>
        <Pressable style={menuStyles.overlay} onPress={() => setShowRename(false)}>
          <Pressable style={menuStyles.renameCard} onPress={() => {}}>
            <Text style={menuStyles.renameTitle}>Change Name</Text>
            <Text style={menuStyles.renameSub}>Give {character?.name} a personal nickname</Text>
            <TextInput
              style={menuStyles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder={character?.name}
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoFocus
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={handleRenameSave}
            />
            <View style={menuStyles.renameBtns}>
              <TouchableOpacity style={menuStyles.renameCancelBtn} onPress={() => setShowRename(false)} activeOpacity={0.75}>
                <Text style={menuStyles.renameCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={menuStyles.renameSaveBtn} onPress={handleRenameSave} activeOpacity={0.85}>
                <Text style={menuStyles.renameSaveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// ── Chat Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.sm },
  headerAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: COLORS.purple },
  headerName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { fontSize: 11, color: '#22c55e', fontWeight: '500' },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1400', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5, gap: 4,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  coinBadgeLocked: { borderColor: COLORS.error, backgroundColor: '#1a0000' },
  coinStar: { fontSize: 11, color: COLORS.gold },
  coinNum: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  coinNumLocked: { color: COLORS.error },

  proBadge: {
    backgroundColor: '#1a1400', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  proBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.gold, letterSpacing: 1 },

  callHeaderBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center',
  },

  messageList: {
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
    paddingBottom: SPACING.md, flexGrow: 1,
  },
  bubbleWrap: { marginBottom: SPACING.sm, maxWidth: '86%' },
  bubbleLeft:  { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: { borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  userBubble: { backgroundColor: COLORS.purple, borderTopRightRadius: 4 },
  companionBubble: {
    backgroundColor: '#07070f', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)', borderTopLeftRadius: 4,
  },
  bubbleText:     { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  userBubbleText: { color: '#fff' },

  examplesTray: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgSurface, paddingVertical: SPACING.sm,
  },
  examplesHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, marginBottom: 8,
  },
  examplesTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  closeCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  examplesRow: { paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  exampleChip: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  exampleChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.25)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  lockedTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  lockedSub:   { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  lockedCta:   { fontSize: 13, fontWeight: '700', color: COLORS.gold, marginLeft: SPACING.sm },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
    gap: SPACING.sm, backgroundColor: COLORS.bgSurface,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md,
    paddingVertical: 12, color: COLORS.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputLocked: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.04)',
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDim: { opacity: 0.4 },
  sendArrow:  { color: '#fff', fontSize: 17, marginLeft: 2 },
});

// ── Call Modal Styles ─────────────────────────────────────────────────────────
const callStyles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: 'rgba(7,7,16,0.97)',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  incomingLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', letterSpacing: 0.4 },
  callAvatar:    { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  callerName:    { fontSize: 32, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  timerText:     { fontSize: 13, color: COLORS.textSecondary },
  btnRow:        { flexDirection: 'row', gap: 80, alignItems: 'center' },
  btnWrap:       { alignItems: 'center', gap: SPACING.sm },
  declineBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center',
  },
  btnLabel: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
});

// ── Menu & Rename Styles ──────────────────────────────────────────────────────
const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111120',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 32, paddingTop: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', letterSpacing: 0.5, marginBottom: 8,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  itemSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },
  cancel: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // Rename modal
  renameCard: {
    backgroundColor: '#111120',
    borderRadius: 20, margin: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  renameTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  renameSub:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  renameInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#ffffff', fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    marginBottom: 20,
  },
  renameBtns:      { flexDirection: 'row', gap: 12 },
  renameCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
  },
  renameCancelTxt: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  renameSaveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#7c3aed', alignItems: 'center',
  },
  renameSaveTxt: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
