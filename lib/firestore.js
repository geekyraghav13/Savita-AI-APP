import {
  collection, doc, addDoc, getDocs, deleteDoc, writeBatch,
  query, orderBy, limit, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const TTL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

function convId(uid, characterId) {
  return `${uid}_${characterId}`;
}

function ttlDate() {
  return new Date(Date.now() + TTL_MS);
}

// ── Save a single message ─────────────────────────────────────────────────────
export async function saveMessage(uid, characterId, role, text) {
  if (!db || !uid) return;
  const ref = collection(db, 'conversations', convId(uid, characterId), 'messages');
  await addDoc(ref, {
    role,
    text,
    createdAt: serverTimestamp(),
    expireAt:  ttlDate(),
  });
}

// ── Update conversation metadata (lastMessageAt + TTL) ───────────────────────
export async function touchConversation(uid, characterId) {
  if (!db || !uid) return;
  await setDoc(
    doc(db, 'conversations', convId(uid, characterId)),
    { uid, characterId, lastMessageAt: serverTimestamp(), expireAt: ttlDate() },
    { merge: true }
  );
}

// ── Load last N messages (oldest → newest) ───────────────────────────────────
export async function loadMessages(uid, characterId, limitCount = 50) {
  if (!db || !uid) return [];
  try {
    const q = query(
      collection(db, 'conversations', convId(uid, characterId), 'messages'),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id:   d.id,
        role: data.role,
        text: data.text,
      };
    });
  } catch {
    return [];
  }
}

// ── Update user notification state when user sends a message ─────────────────
// Resets the 3-notification cycle and updates the rolling 7-message window.
export async function onUserMessageSent(uid, text, characterId, characterName, userName) {
  if (!db || !uid) return;
  const userRef = doc(db, 'users', uid);

  // Read current window to build updated one (we don't have local state here)
  // The chat screen passes the updated window directly — see parameter lastMessages
  await setDoc(userRef, {
    lastChatAt:        serverTimestamp(),
    lastCharacterId:   characterId,
    lastCharacterName: characterName,
    userName,
    notifyCount:       0,
    nextNotifyAt:      new Date(Date.now() + 3 * 60 * 60 * 1000), // +3h
    expireAt:          ttlDate(),
    lastAppOpenAt:     serverTimestamp(),
  }, { merge: true });
}

// ── Save rolling 7-message window ────────────────────────────────────────────
export async function saveLastMessages(uid, lastMessages) {
  if (!db || !uid) return;
  await setDoc(doc(db, 'users', uid), { lastMessages }, { merge: true });
}

// ── Delete all messages in a conversation (clear chat) ───────────────────────
export async function clearConversation(uid, characterId) {
  if (!db || !uid) return;
  const msgsRef = collection(db, 'conversations', convId(uid, characterId), 'messages');
  const snap    = await getDocs(msgsRef);
  if (snap.empty) return;

  // Firestore batch limit is 500 writes — chunk if needed
  const chunks = [];
  let batch = writeBatch(db);
  let count = 0;
  snap.docs.forEach((d) => {
    batch.delete(d.ref);
    count++;
    if (count === 499) {
      chunks.push(batch);
      batch = writeBatch(db);
      count = 0;
    }
  });
  chunks.push(batch);
  await Promise.all(chunks.map((b) => b.commit()));
}

// ── Update lastAppOpenAt + refresh TTL on every app open ─────────────────────
export async function refreshUserSession(uid) {
  if (!db || !uid) return;
  await setDoc(doc(db, 'users', uid), {
    lastAppOpenAt: serverTimestamp(),
    expireAt:      ttlDate(),
  }, { merge: true });
}
