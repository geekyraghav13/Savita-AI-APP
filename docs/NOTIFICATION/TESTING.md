# Push Notification — Testing Guide

> **Build tested on:** v1.0.5 (versionCode 6)
> APK: `SAVITA-ai-v1.0.5-release.apk`

---

## Prerequisites

- Android device with the v1.0.5 APK installed
- Firebase Console access → project `savita-ai-app`
- `adb` installed (Android Debug Bridge)
- Both Cloud Functions deployed:
  - `generateNotifications`
  - `sendRetentionNotifications`

---

## 1. Install the APK on Device

```bash
adb install -r "SAVITA-ai-v1.0.5-release.apk"
```

Or transfer the APK manually and install with "Allow from unknown sources".

---

## 2. Verify FCM Token is Saved

**Steps:**
1. Open the app
2. Sign in (Google or Guest)
3. Start a chat, send at least 1 message
4. Go back to dashboard

**Check in Firebase Console:**
```
Firestore → users → {your uid}
→ pushToken: "f3xK2p..."   ← must not be null
→ lastChatAt: timestamp
→ notifyCount: 0
→ nextNotifyAt: ~3 hours from now
```

If `pushToken` is null, the device denied notification permission — check:
```
Android Settings → Apps → SAVITA ai → Notifications → Allow
```

---

## 3. Test Way 1 — Automated Contextual Notification

### Option A — Force trigger via Firestore (fastest, no waiting)

1. Go to **Firebase Console → Firestore → users → {your uid}**
2. Edit these fields:
   ```
   nextNotifyAt  →  set to 1 minute ago (any past timestamp)
   notifyCount   →  0
   ```
3. Wait up to 15 minutes for the Cloud Function to fire
4. You should receive a notification on your device

> The Cloud Function runs every 15 minutes. To trigger immediately, use Option B.

### Option B — Trigger Cloud Function manually via Firebase Console

1. **Firebase Console → Functions → sendRetentionNotifications**
2. Click the 3-dot menu → **"View in Cloud Console"**
3. In Google Cloud Console → **"Test Function"** → run with empty body `{}`
4. Notification arrives within seconds

### Option C — Wait the real 3 hours

1. Send messages in a chat
2. Go back to dashboard (triggers Gemini notification generation)
3. Wait 3 hours
4. Notification 1 arrives automatically

---

## 4. Verify Gemini Contextual Generation

**Steps:**
1. Open a chat, send 3–7 messages about a specific topic (e.g. "I've been stressed about exams")
2. Press back to go to dashboard
3. Wait ~5 seconds (Gemini call is async)

**Check in Firestore:**
```
users → {uid} → pendingNotifications:
  n1: { title: "...", body: "...mentions exams..." }
  n2: { title: "...", body: "..." }
  n3: { title: "...", body: "..." }
```

If `pendingNotifications` is missing or n1/n2/n3 are null → Gemini key issue.
Check Cloud Function logs:
```
Firebase Console → Functions → generateNotifications → Logs
```

---

## 5. Test Way 2 — Manual Campaign (Firebase Console)

1. **Firebase Console → Engage → Messaging → New Campaign**
2. Select **"Firebase Notification messages"**
3. Fill in:
   ```
   Title:  Test from Console
   Body:   This is a manual broadcast test
   ```
4. Click **Next → Target → User segment → App: SAVITA ai (Android)**
5. Click **Next → Schedule → Now**
6. Click **Review → Publish**
7. Notification appears on device within 30 seconds

---

## 6. Test the Full 3-Notification Cycle

To test all 3 notifications without waiting 24 hours:

**In Firestore → users → {uid}, set:**
```
notifyCount   = 0
nextNotifyAt  = [1 minute ago]
lastChatAt    = [now]
```

Wait for Notification 1 to arrive. Then immediately set:
```
notifyCount   = 1
nextNotifyAt  = [1 minute ago]
```

Wait for Notification 2. Then:
```
notifyCount   = 2
nextNotifyAt  = [1 minute ago]
```

Wait for Notification 3. Then verify:
```
notifyCount   = 3
nextNotifyAt  = null   ← no more notifications
```

---

## 7. Test Notification Reset on Chat

1. Complete the 3-notification cycle (or set `notifyCount = 3`)
2. Open the app, send a message in chat, go back
3. Check Firestore:
   ```
   notifyCount   = 0       ← reset
   nextNotifyAt  = +3h     ← new cycle started
   ```

---

## 8. Test Auto-Delete (TTL — 10 day inactive)

> This is destructive — only test on a throwaway account.

**In Firestore → users → {uid}:**
```
expireAt  →  set to any past timestamp (e.g. yesterday)
```

Firestore TTL deletion runs every 24–48 hours. The document and all
`conversations/{uid}_*` subcollections will be automatically deleted.

---

## 9. Check Cloud Function Logs

```
Firebase Console → Functions → Logs
```

Healthy log output looks like:
```
[Retention] Processed 3 users
[FCM] Sent to uid=abc123
[generateNotifications] Gemini success for uid=abc123
```

Error patterns to watch:
```
GEMINI_API_KEY environment variable is not set  → key missing in functions/.env
messaging/invalid-registration-token            → device token expired, auto-cleared
UNAUTHENTICATED                                 → app called function without auth
```

---

## 10. Common Issues

| Issue | Cause | Fix |
|---|---|---|
| No notification received | Permission denied | Settings → Apps → SAVITA ai → Notifications → On |
| `pushToken` null in Firestore | Permission not granted | Same as above |
| `pendingNotifications` missing | Gemini key not set | Check `functions/.env` has `GEMINI_API_KEY` |
| Notification is generic (not contextual) | Gemini failed, fallback used | Check function logs for Gemini error |
| Function not triggering | Scheduler not set up | Firebase Console → Functions → verify schedule |
| 403 on function call | Auth issue | Ensure user is signed in before chat |
