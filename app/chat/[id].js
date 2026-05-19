import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { characters } from '../../characters';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_MODELS,
  OPENROUTER_URL,
} from '../../config';

async function callOpenRouter(apiMessages) {
  let lastErr = null;
  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://savita-ai.app',
          'X-Title': 'SAVITA ai',
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.8,
          max_tokens: 300,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastErr = new Error(
          `[${model}] ${data?.error?.message || `HTTP ${response.status}`}`
        );
        continue;
      }

      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        lastErr = new Error(`[${model}] empty response`);
        continue;
      }
      return reply;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All models failed');
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const character = characters.find((c) => c.id === id) || characters[0];

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm ${character.name} ${character.emoji} ${character.description.toLowerCase()}. What's on your mind?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: `${character.name} ${character.emoji}`,
      headerStyle: { backgroundColor: character.color },
    });
  }, [character, navigation]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = [
        { role: 'system', content: character.systemPrompt },
        ...nextMessages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      const reply = await callOpenRouter(apiMessages);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-a',
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (err) {
      Alert.alert('Chat error', err.message || 'Something went wrong.');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-e',
          role: 'assistant',
          content: '⚠️ I had trouble responding. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.msgRow,
          { justifyContent: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!isUser && (
          <Image source={{ uri: character.avatar }} style={styles.msgAvatar} />
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? styles.userBubble
              : [styles.botBubble, { backgroundColor: character.color + '33' }],
          ]}
        >
          <Text style={styles.bubbleText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: `${character.name} ${character.emoji}`,
          headerStyle: { backgroundColor: character.color },
        }}
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={character.color} />
          <Text style={styles.typingText}>
            {character.name} is typing...
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputBar,
          { paddingBottom: 10 + (insets.bottom || 0) },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Message ${character.name}...`}
          placeholderTextColor="#888"
          style={styles.input}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                loading || !input.trim() ? '#444' : character.color,
            },
          ]}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  list: {
    padding: 12,
    paddingBottom: 16,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  typingText: {
    color: '#a0a0c0',
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    alignItems: 'flex-end',
    backgroundColor: '#16162a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    color: '#fff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
