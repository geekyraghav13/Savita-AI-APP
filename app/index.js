import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { characters } from '../characters';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Pick a character</Text>
      <Text style={styles.subheading}>
        Tap a character to start chatting ✨
      </Text>

      <View style={styles.grid}>
        {characters.map((char) => (
          <TouchableOpacity
            key={char.id}
            style={[styles.card, { backgroundColor: char.color }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/chat/${char.id}`)}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: char.avatar }} style={styles.avatar} />
            </View>
            <Text style={styles.emoji}>{char.emoji}</Text>
            <Text style={styles.name}>{char.name}</Text>
            <Text style={styles.role}>{char.role}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {char.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  subheading: {
    fontSize: 15,
    color: '#a0a0c0',
    marginTop: 6,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 30,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '600',
  },
  desc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
});
