import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs, LinearGradient as SvgGrad, Stop, Text as SvgText,
} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, Mic, Lightbulb, Shield, AudioLines } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { Icon: Heart,      label: 'Friendly\nConversations' },
  { Icon: AudioLines, label: 'Natural\nVoice Chat' },
  { Icon: Lightbulb,  label: 'Ideas &\nInspiration' },
  { Icon: Shield,     label: 'Private &\nRespectful' },
];

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1, { toValue: 1.25, duration: 900, useNativeDriver: true }),
          Animated.timing(ring1, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(ring2, { toValue: 1.5, duration: 900, useNativeDriver: true }),
          Animated.timing(ring2, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();

    const nav = async () => {
      await new Promise((r) => setTimeout(r, 3500));
      proceed();
    };
    nav();
  }, []);

  const proceed = async () => {
    // DEV: clear flag so slider always shows while building onboarding screens
    await AsyncStorage.removeItem('onboarded');
    router.replace('/(onboarding)/slider');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#08001a', '#100025', '#160030', '#1c003a']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topGlow} />

      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>

        {/* Hero logo */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity }]}>
          <Image
            source={require('../../assets/images/savita-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Gradient "Savita" title via SVG — Expo Go compatible */}
        <Animated.View style={[styles.titleWrap, { opacity: contentOpacity }]}>
          <Svg height={56} width={220}>
            <Defs>
              <SvgGrad id="tg" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0"   stopColor="#ff6bca" stopOpacity="1" />
                <Stop offset="0.5" stopColor="#c44dff" stopOpacity="1" />
                <Stop offset="1"   stopColor="#7c3aed" stopOpacity="1" />
              </SvgGrad>
            </Defs>
            <SvgText
              fill="url(#tg)"
              fontSize={44}
              fontWeight="bold"
              x={110}
              y={50}
              textAnchor="middle"
            >
              Savita
            </SvgText>
          </Svg>
          <Text style={styles.subtitle}>Your AI Companion</Text>
        </Animated.View>

        {/* Feature cards */}
        <Animated.View style={[styles.cards, { opacity: contentOpacity }]}>
          {FEATURES.map(({ Icon, label }, i) => (
            <View key={i} style={styles.card}>
              <LinearGradient colors={['#2a0050', '#1a0035']} style={styles.cardGradient}>
                <View style={styles.iconCircle}>
                  <Icon color="#c44dff" size={22} strokeWidth={1.8} />
                </View>
                <Text style={styles.cardLabel}>{label}</Text>
              </LinearGradient>
            </View>
          ))}
        </Animated.View>

        {/* Mic button */}
        <Animated.View style={[styles.micWrap, { opacity: contentOpacity }]}>
          <Animated.View style={[styles.ring, styles.ringOuter, { transform: [{ scale: ring2 }] }]} />
          <Animated.View style={[styles.ring, styles.ringInner, { transform: [{ scale: ring1 }] }]} />
          <TouchableOpacity style={styles.micBtn} onPress={proceed} activeOpacity={0.8}>
            <LinearGradient colors={['#9d4edd', '#7c3aed']} style={styles.micBtnGradient}>
              <Mic color="#fff" size={30} strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom arc decoration */}
        <View style={styles.bottomWaves}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.wave, { opacity: 0.08 + i * 0.04, bottom: i * 10 }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const CARD_W = (width - 48 - 24) / 4;

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#08001a' },
  topGlow:         { position: 'absolute', top: -80, left: width / 2 - 120, width: 240, height: 240, borderRadius: 120, backgroundColor: '#7c3aed', opacity: 0.18 },
  container:       { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  logoWrap:        { width: width * 0.65, height: height * 0.32, alignItems: 'center', justifyContent: 'center' },
  logoImage:       { width: '100%', height: '100%' },
  titleWrap:       { alignItems: 'center', gap: 4 },
  subtitle:        { fontSize: 15, color: '#b0a0c0', letterSpacing: 1 },
  cards:           { flexDirection: 'row', gap: 8, width: '100%' },
  card:            { width: CARD_W, borderRadius: 16, overflow: 'hidden', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6, borderWidth: 1, borderColor: '#7c3aed33' },
  cardGradient:    { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 8 },
  iconCircle:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3d006633', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#9d4edd44' },
  cardLabel:       { fontSize: 9.5, color: '#c0a8d8', textAlign: 'center', lineHeight: 14, fontWeight: '500' },
  micWrap:         { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  ring:            { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: '#9d4edd' },
  ringOuter:       { width: 90, height: 90, opacity: 0.2 },
  ringInner:       { width: 74, height: 74, opacity: 0.35 },
  micBtn:          { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', shadowColor: '#9d4edd', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 16, elevation: 10 },
  micBtnGradient:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomWaves:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  wave:            { position: 'absolute', left: -20, right: -20, height: 40, borderTopLeftRadius: 100, borderTopRightRadius: 100, borderWidth: 1, borderColor: '#9d4edd', borderBottomWidth: 0 },
});
