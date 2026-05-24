import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

// TODO: Replace with your Firebase Storage video URL
const VIDEO_URL = null;

export default function VideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ctaVisible, setCtaVisible] = useState(!VIDEO_URL);

  const player = useVideoPlayer(
    VIDEO_URL ?? '',
    useCallback((p) => {
      if (!VIDEO_URL) return;
      p.loop = false;
      p.play();
    }, [])
  );

  const handleContinue = () => router.replace('/(onboarding)/language');

  // No video yet — show branded placeholder
  if (!VIDEO_URL) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderLogo}>SAVITA</Text>
          <Text style={styles.placeholderText}>Intro video</Text>
          <Text style={styles.placeholderSub}>
            Add your Firebase Storage URL to{'\n'}
            <Text style={styles.code}>app/(onboarding)/video.js → VIDEO_URL</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.btnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        onPlayToEnd={() => setCtaVisible(true)}
      />

      {/* Dark gradient overlay at bottom */}
      <View style={styles.overlay} />

      {ctaVisible && (
        <TouchableOpacity
          style={[styles.btn, styles.btnAbsolute, { bottom: insets.bottom + SPACING.xl }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Get Started →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  placeholderLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 10,
  },
  placeholderText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  placeholderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  code: {
    color: COLORS.purpleLight,
    fontFamily: 'monospace',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: 'transparent',
    // Simulated gradient via semi-transparent black
    ...StyleSheet.flatten({ background: 'linear-gradient(transparent, #000)' }),
  },
  btn: {
    width: width - SPACING.xl * 2,
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
  },
  btnAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: SPACING.xl,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
