const { onSchedule }       = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin                = require('firebase-admin');
const { getFallbackNotification } = require('./templates');

admin.initializeApp();
const db = admin.firestore();

// Run all functions in asia-south1 (Mumbai) — closest to India
setGlobalOptions({ region: 'asia-south1' });

// ── Scheduled retention notification sender ───────────────────────────────────
// Runs every 15 minutes. Finds users due for a notification (nextNotifyAt <= now
// and notifyCount < 3) and sends one FCM message per user.
exports.sendRetentionNotifications = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Asia/Kolkata' },
  async () => {
    const now = admin.firestore.Timestamp.now();

    // Query users who are due for a notification
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
      const count = user.notifyCount ?? 0;  // 0 = about to send first

      if (!user.pushToken) continue;

      // ── Pick notification text ───────────────────────────────────────────
      const pending = user.pendingNotifications;
      const key     = `n${count + 1}`;
      let title, body;

      if (pending?.[key]?.title && pending?.[key]?.body) {
        // Gemini pre-generated — use it
        title = pending[key].title;
        body  = pending[key].body;
      } else {
        // Fallback template
        const fallback = getFallbackNotification(
          user.lastCharacterName ?? 'Savita',
          user.userName ?? 'you',
          count,
        );
        title = fallback.title;
        body  = fallback.body;
      }

      // ── Send FCM ─────────────────────────────────────────────────────────
      const sendPromise = admin.messaging().send({
        token: user.pushToken,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'savita_retention',
            color:     '#9d4edd',
          },
        },
        data: {
          characterId: user.lastCharacterId ?? '',
          screen:      'chat',
        },
      }).catch((err) => {
        // Invalid / expired token — clear it so we stop trying
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        ) {
          batch.update(docSnap.ref, { pushToken: null });
        }
        console.error(`[FCM] Failed for uid=${uid}:`, err.message);
      });

      fcmPromises.push(sendPromise);

      // ── Advance notification state ────────────────────────────────────────
      const newCount = count + 1;
      const updates  = { notifyCount: newCount };

      if (newCount === 1 && user.lastChatAt) {
        // Notification 2 fires at lastChatAt + 12h
        updates.nextNotifyAt = new admin.firestore.Timestamp(
          user.lastChatAt.seconds + 12 * 3600, 0
        );
      } else if (newCount === 2 && user.lastChatAt) {
        // Notification 3 fires at lastChatAt + 24h
        updates.nextNotifyAt = new admin.firestore.Timestamp(
          user.lastChatAt.seconds + 24 * 3600, 0
        );
      } else {
        // All 3 sent — stop until user chats again
        updates.nextNotifyAt = null;
      }

      batch.update(docSnap.ref, updates);
    }

    await Promise.all(fcmPromises);
    await batch.commit();

    console.log(`[Retention] Processed ${snapshot.size} users`);
  }
);
