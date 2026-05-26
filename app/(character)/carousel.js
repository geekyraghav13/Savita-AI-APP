import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Gem } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { CHARACTERS } from '../../constants/characters';

const THUMB = 68;

export default function CarouselScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayChar, setDisplayChar] = useState(CHARACTERS[0]);

  const setCharacter = useAppStore((s) => s.setCharacter);
  const isPremium = useAppStore((s) => s.isPremium);

  // Opacity drives the background fade — 1 = visible, 0 = black
  const bgOpacity = useRef(new Animated.Value(1)).current;

  const isLocked = displayChar.isPremium && !isPremium;

  const handleSelect = (index) => {
    if (index === selectedIndex) return;

    // 1. Fade background to black
    Animated.timing(bgOpacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      // 2. Swap character while screen is dark — zero visible jump
      setSelectedIndex(index);
      setDisplayChar(CHARACTERS[index]);

      // 3. Fade new portrait in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = () => {
    setCharacter(displayChar);
    router.push('/(character)/name');
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Background portrait (fades in/out on character switch) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <ImageBackground
          source={displayChar.image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          imageStyle={
            displayChar.imageTransform
              ? { transform: displayChar.imageTransform }
              : undefined
          }
        >
          {isLocked && <View style={styles.lockedOverlay} />}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.88)']}
            locations={[0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </ImageBackground>
      </Animated.View>

      {/* ── Header (always full opacity) ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Choose Your Girlfriend</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <X color="#fff" size={18} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Premium locked centre ── */}
      {isLocked && (
        <View style={styles.lockedCenter}>
          <Gem color="#fff" size={100} strokeWidth={1.2} />
          <Text style={styles.eliteTitle}>Elite Girl</Text>
          <Text style={styles.eliteSub}>only for premiums</Text>
        </View>
      )}

      {/* ── Bottom section ── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>{displayChar.name}</Text>
        </View>

        <FlatList
          data={CHARACTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.thumbRow}
          renderItem={({ item, index }) => {
            const active = index === selectedIndex;
            const locked = item.isPremium && !isPremium;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(index)}
                activeOpacity={0.75}
                style={[styles.thumbRing, active && styles.thumbRingActive]}
              >
                <View style={styles.thumbInner}>
                  {locked ? (
                    <View style={styles.thumbLockedBg}>
                      <Gem color="#fff" size={24} strokeWidth={1.5} />
                    </View>
                  ) : (
                    <Image source={item.image} style={styles.thumbImage} resizeMode="cover" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.88}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.74)',
  },
  lockedCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  eliteTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    marginTop: 6,
  },
  eliteSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  nameBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 11,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  thumbRow: {
    paddingHorizontal: 12,
  },
  thumbRing: {
    width: THUMB + 8,
    height: THUMB + 8,
    borderRadius: (THUMB + 8) / 2,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  thumbRingActive: {
    borderColor: '#fff',
  },
  thumbInner: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbLockedBg: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15,15,30,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueBtn: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 18,
    marginHorizontal: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
