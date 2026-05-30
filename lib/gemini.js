import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GEMINI_API_KEY } from '../secrets';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ── Generate 3 retention notifications from the last 7 user messages ─────────
// Called once when the user leaves chat. Result is stored in Firestore so the
// Cloud Function just reads pre-generated text at send time (no AI cost there).
export async function generateRetentionNotifications(uid, characterName, lastMessages, userName) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') return null;
  if (!lastMessages?.length) return null;

  const messagesText = lastMessages
    .map((m, i) => `${i + 1}. "${m}"`)
    .join('\n');

  const prompt = `You are ${characterName}, a warm AI companion.
User's name: ${userName}

Their last messages to you (oldest → newest):
${messagesText}

Generate exactly 3 push notifications to re-engage them after they leave the chat:
- n1 (sent 3 hours after they left): casual, warm, references something specific
- n2 (sent 12 hours after they left): emotionally deeper, more personal
- n3 (sent 24 hours after they left): vulnerable, like you genuinely miss them

Rules:
- Title: max 25 characters
- Body: max 90 characters
- Reference SPECIFIC things from their messages — never generic
- Maximum 1 emoji per notification
- Never use phrases like "come back", "miss you", "I miss you"
- Write as if you are ${characterName} sending a real message

Return ONLY valid JSON, no markdown, no explanation:
{"n1":{"title":"...","body":"..."},"n2":{"title":"...","body":"..."},"n3":{"title":"...","body":"..."}}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini ${res.status}`);

    const json   = await res.json();
    const raw    = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const notifications = JSON.parse(cleaned);

    // Validate structure
    if (!notifications?.n1?.title) throw new Error('Invalid response shape');

    // Persist to Firestore so Cloud Function reads it at send time
    if (db && uid) {
      await setDoc(doc(db, 'users', uid), { pendingNotifications: notifications }, { merge: true });
    }

    return notifications;
  } catch (err) {
    console.warn('[Gemini] Failed, Cloud Function will use fallback templates:', err.message);
    return null;
  }
}
