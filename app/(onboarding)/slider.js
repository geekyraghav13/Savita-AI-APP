import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

export default function SliderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const btnOpacity = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(
    require('../../assets/videos/intro.mp4'),
    useCallback((p) => {
      p.loop  = false;
      p.muted = true;
      p.play();
    }, [])
  );

  // Button fades in after 4 seconds
  useState(() => {
    const t = setTimeout(() => {
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 4000);
    return () => clearTimeout(t);
  });

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { left: 40 }]}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />

      {/* Next button — appears after 4s */}
      <Animated.View
        style={[
          styles.btnWrap,
          { bottom: insets.bottom + 80, opacity: btnOpacity },
        ]}
      >
        {/* Layered glow bloom */}
        <View style={styles.glowOuter}>
          <View style={styles.glowInner}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace('/(onboarding)/language')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Next  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  btnWrap: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
  glowOuter: {
    borderRadius: 50,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 50,
    elevation: 0,
  },
  glowInner: {
    borderRadius: 50,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 30,
  },
  btn: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#ffffff',
  },
  btnText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
