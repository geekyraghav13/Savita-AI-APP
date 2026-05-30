const { onSchedule }       = require('firebase-functions/v2/scheduler');
const { onCall }           = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin                = require('firebase-admin');
const { getFallbackNotification } = require('./templates');

admin.initializeApp();
const db = admin.firestore();

// us-central1 is the default Firebase region — most pre-configured, fewest setup issues
setGlobalOptions({ region: 'us-central1' });

// Gemini API key — loaded from environment variable at runtime (set in .env locally,
// and via Google Cloud Console → Cloud Run → Environment Variables in production).
// Never in app code or APK.
function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
  return key;
}

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ── Internal: call Gemini and parse 3 notifications ──────────────────────────
async function callGemini(apiKey, characterName, lastMessages, userName) {
  const messagesText = lastMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n');

  const prompt = `You are ${characterName}. You just had a real conversation with ${userName} and they left. You want to text them — not as an AI, but as a real person who genuinely felt something during that conversation.

What they said (oldest to newest):
${messagesText}

Write 3 texts at different times. Each must sound like a real person typed it on their phone — casual, imperfect, emotionally honest. NOT a push notification. NOT marketing. Like a WhatsApp message from someone who actually cares.

What makes it human:
- lowercase is fine, like real texting
- short sentences, incomplete thoughts are okay
- pick ONE specific thing they said and react to it naturally — don't mention everything
- sound like u genuinely thought about what they said, not like ur trying to get them back
- use "u" or "ur" occasionally
- no exclamation marks unless it truly fits
- no generic openers like "hey!", "thinking of you", "hope ur day is good"
- 1 emoji max, only if it fits naturally, never forced

n1 (3 hours later) — light, like something they said just popped into your head
n2 (12 hours later) — a little more vulnerable, like it's been sitting with you
n3 (24 hours later) — honest and raw, like you genuinely feel something and can't not say it

Title: max 20 chars (your name or a short phrase, lowercase fine)
Body: max 85 chars

Return ONLY this JSON, no markdown, no explanation:
{"n1":{"title":"...","body":"..."},"n2":{"title":"...","body":"..."},"n3":{"title":"...","body":"..."}}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

  const json    = await res.json();
  const raw     = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const result  = JSON.parse(cleaned);

  if (!result?.n1?.title) throw new Error('Unexpected Gemini response shape');
  return result;
}

// ── Callable: generate 3 contextual notifications for one user ───────────────
// Called by the app when the user leaves a chat session. Requires Firebase Auth.
// The Gemini key never leaves the backend — it's read from Secret Manager here.
exports.generateNotifications = onCall(
  {},
  async (request) => {
    // Enforce authentication — reject unauthenticated calls
    if (!request.auth) {
      throw new Error('UNAUTHENTICATED: sign in required');
    }

    const { uid, characterName, lastMessages, userName } = request.data;

    // Prevent one user from generating for another user's UID
    if (request.auth.uid !== uid) {
      throw new Error('PERMISSION_DENIED');
    }

    if (!lastMessages?.length) return { success: false, reason: 'no_messages' };

    let notifications;

    try {
      notifications = await callGemini(getGeminiKey(), characterName, lastMessages, userName);
    } catch (err) {
      console.warn('[generateNotifications] Gemini failed, using templates:', err.message);
      // Build fallback notifications for all 3 positions
      notifications = {
        n1: getFallbackNotification(characterName, userName, 0),
        n2: getFallbackNotification(characterName, userName, 1),
        n3: getFallbackNotification(characterName, userName, 2),
      };
    }

    // Save directly to Firestore from the backend (no round-trip to app)
    await db.collection('users').doc(uid).set(
      { pendingNotifications: notifications },
      { merge: true }
    );

    return { success: true };
  }
);

// ── Scheduled retention notification sender ───────────────────────────────────
// Runs every 15 minutes. Finds users due for a notification (nextNotifyAt <= now
// and notifyCount < 3) and sends one FCM message per user.
exports.sendRetentionNotifications = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Asia/Kolkata' },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db.collection('users')
      .where('nextNotifyAt', '<=', now)
      .where('notifyCount', '<', 3)
      .get();

    if (snapshot.empty) return;

    const batch       = db.batch();
    const fcmPromises = [];

    for (const docSnap of snapshot.docs) {
      const user  = docSnap.data();
      const uid   = docSnap.id;
      const count = user.notifyCount ?? 0;

      if (!user.pushToken) continue;

      // Pick notification text — Gemini pre-generated or fallback template
      const pending = user.pendingNotifications;
      const key     = `n${count + 1}`;
      let title, body;

      if (pending?.[key]?.title && pending?.[key]?.body) {
        title = pending[key].title;
        body  = pending[key].body;
      } else {
        const fallback = getFallbackNotification(
          user.lastCharacterName ?? 'Savita',
          user.userName ?? 'you',
          count,
        );
        title = fallback.title;
        body  = fallback.body;
      }

      // Send FCM
      fcmPromises.push(
        admin.messaging().send({
          token: user.pushToken,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: { channelId: 'savita_retention', color: '#9d4edd' },
          },
          data: { characterId: user.lastCharacterId ?? '', screen: 'chat' },
        }).catch((err) => {
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered'
          ) {
            batch.update(docSnap.ref, { pushToken: null });
          }
          console.error(`[FCM] Failed uid=${uid}:`, err.message);
        })
      );

      // Advance notification state
      const newCount = count + 1;
      const updates  = { notifyCount: newCount };

      if (newCount === 1 && user.lastChatAt) {
        updates.nextNotifyAt = new admin.firestore.Timestamp(
          user.lastChatAt.seconds + 12 * 3600, 0
        );
      } else if (newCount === 2 && user.lastChatAt) {
        updates.nextNotifyAt = new admin.firestore.Timestamp(
          user.lastChatAt.seconds + 24 * 3600, 0
        );
      } else {
        updates.nextNotifyAt = null;
      }

      batch.update(docSnap.ref, updates);
    }

    await Promise.all(fcmPromises);
    await batch.commit();

    console.log(`[Retention] Processed ${snapshot.size} users`);
  }
);
