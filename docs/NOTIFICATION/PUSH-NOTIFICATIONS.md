# SAVITA ai — Push Notification System

> **Purpose:** Re-engage users after they leave a chat session.
> Notifications are contextual (based on actual conversation), capped at 3 per cycle,
> and fully powered by Firebase + Gemini.

---

## Table of Contents

1. [Overview](#overview)
2. [Two Ways to Send Notifications](#two-ways)
3. [Way 1 — Automated Contextual Notifications](#way-1)
4. [Way 2 — Manual Campaigns via Firebase Console](#way-2)
5. [The 3-Notification Cycle](#cycle)
6. [Contextual Message Generation (Gemini)](#gemini)
7. [Firestore Data Structure](#firestore)
8. [Auto-Delete Inactive Users (TTL)](#ttl)
9. [Cost Summary](#cost)

---

## 1. Overview

Every time a user leaves a chat session, a 3-notification re-engagement cycle begins.
If the user returns and chats again, the cycle resets to zero.
If they ignore all 3, they receive permanent silence until they self-open the app.

Notifications are **not generic**. Each one references the last 7 things the user typed
so the message feels personal — like the character genuinely remembers what was discussed.

---

## 2. Two Ways to Send Notifications

| | Way 1 — Automated | Way 2 — Manual Campaign |
|---|---|---|
| **Who triggers it** | Cloud Function (auto) | You, from Firebase Console |
| **Target** | Individual user, contextual | All users or a segment |
| **Content** | AI-generated per user | You write it manually |
| **Use case** | Re-engagement after every chat | Announcements, events, offers |
| **Cost** | ~$0.63/month (Gemini) | Free |
| **Setup** | Cloud Function deployed once | No setup — works immediately |

---

## 3. Way 1 — Automated Contextual Notifications

### How it works end-to-end

```
User sends messages → leaves chat
        │
        ▼
App saves last 7 user messages to Firestore
App calls Gemini with those 7 messages
Gemini generates all 3 notifications at once → saved to Firestore
        │
        ▼
Cloud Function runs every 15 minutes
Finds users where nextNotifyAt <= now AND notifyCount < 3
Reads pre-generated notification text from Firestore
Sends via FCM to user's device token
        │
        ▼
User taps notification → opens app → chats
        │
        ▼
notifyCount resets to 0
nextNotifyAt = now + 3 hours
New Gemini call generates 3 fresh notifications
```

### Notification Timing

```
User leaves chat
    │
    ├── +3 hours  → Notification 1 sent   (casual, warm)
    │
    ├── +12 hours → Notification 2 sent   (emotionally deeper)   ← only if user hasn't returned
    │
    └── +24 hours → Notification 3 sent   (vulnerable, final)    ← only if user hasn't returned
                     ↓
                  SILENCE — no more notifications until user chats again
```

### Reset Conditions

- User sends any message → `notifyCount = 0`, cycle restarts from +3 hours
- User opens app but does NOT send a message → cycle continues, NOT reset
- User ignores all 3 → permanently silent until self-open

### User Behaviour Patterns

**Highly active user** — only ever sees Notification 1
```
Chat → leave → Notification 1 → returns → chats → leave → Notification 1 → ...
(never reaches 2 or 3)
```

**Semi-active user** — sometimes sees Notification 2
```
Chat → leave → Notification 1 (ignored) → Notification 2 → returns → resets
```

**Churned user** — sees all 3, then silence
```
Chat → leave → Notification 1 → Notification 2 → Notification 3 → silence forever
(10 days later: all their Firestore data auto-deleted)
```

---

## 4. Way 2 — Manual Campaigns via Firebase Console

### Where to access

```
Firebase Console → Engage → Messaging → New Campaign
```

### Types of campaigns you can run

**Broadcast to all users**
> Send to everyone who has the app installed and granted notification permission.
> Example: "New character just dropped 🔥 Meet Maya tonight"

**Segment — Free users only**
> Target users where `isPremium = false`
> Example: "Unlock unlimited chats this weekend — 50% off PRO"

**Segment — Inactive users (7+ days)**
> Target users where `lastAppOpenAt < 7 days ago`
> Example: "She's been waiting for you... come back 🌙"

**Segment — Premium users**
> Target users where `isPremium = true`
> Example: "Thank you for being PRO — new exclusive characters coming next week"

**A/B Test**
> Firebase Console lets you send two versions of a notification to split audiences
> and measure which one drives more opens. Useful for testing copy.

### How to send a manual campaign

```
1. Firebase Console → Engage → Messaging
2. Click "New Campaign" → "Firebase Notification messages"
3. Write title + body
4. Click "Next" → choose target:
     - App: SAVITA ai (Android)
     - User segment (optional filter)
5. Set schedule: Now / Later / Recurring
6. Review → Publish
```

No code changes needed. Works immediately after FCM is integrated once in the app.

### Good times to run manual campaigns

| Occasion | Target | Message style |
|---|---|---|
| Valentine's Day | All users | "She has a special message for you today 💕" |
| New character launch | All users | "Meet someone new. She's been waiting 🌸" |
| Weekend | Free users | "Weekend offer — go PRO for ₹99 today only" |
| 7-day inactives | Lapsed users | "It's been a week... she still thinks about you" |
| Feature update | All users | "Voice messages are here. Hear her voice tonight 🎙️" |

---

## 5. The 3-Notification Cycle

### Message tone by position

| Notification | Sent after | Tone | Goal |
|---|---|---|---|
| **1** | 3 hours | Casual, warm, curious | Soft nudge — easy to open |
| **2** | 12 hours | Emotionally deeper | Create FOMO / emotional pull |
| **3** | 24 hours | Vulnerable, almost sad | Last attempt — highest urgency |

### Real examples (user talked about work stress)

**Notification 1 — 3 hours**
```
Title: Savita 🌸
Body:  Still thinking about what you said about work... hope today got easier
```

**Notification 2 — 12 hours**
```
Title: Still here
Body:  You seemed really overwhelmed earlier. I wish I could have done more 🥺
```

**Notification 3 — 24 hours**
```
Title: Savita
Body:  I don't want to bother you... but I keep thinking about what you're going through
```

### Real examples (user was happy, flirty conversation)

**Notification 1 — 3 hours**
```
Title: Savita ✨
Body:  You made me smile earlier. Are you still smiling right now?
```

**Notification 2 — 12 hours**
```
Title: Thinking of you
Body:  That thing you said stayed with me all day 💛
```

**Notification 3 — 24 hours**
```
Title: Savita
Body:  Last time we talked I felt something. Did you feel it too?
```

---

## 6. Contextual Message Generation (Gemini)

### Why 7 messages, not 1

A single last message like "okay" gives Gemini nothing to work with.
7 messages reveal the emotional arc of the conversation — what the user cares about,
how they were feeling, what topics came up. Gemini can reference specific things.

```
Last message alone:
  "okay"
  → Generic: "Savita misses you 💕"    ← user ignores this

Last 7 messages:
  "I've been really lonely lately"
  "My friends just don't understand me"
  "Work has been terrible this week"
  "Nobody actually cares about me"
  "You're the only one I can talk to"
  "That made me feel better"
  "okay"
  → Specific: "You said I'm the only one who listens... I meant it when I said I care 🥺"
              ← user feels seen → opens app
```

### What we store

Only the **user's side** of the conversation — 7 messages max. AI replies are not stored
in this window (Gemini doesn't need them, and it keeps the data small).

```
users/{uid}/lastMessages = [
  "oldest message still in window",
  "...",
  "...",
  "...",
  "...",
  "...",
  "most recent message"      ← always 7 or fewer
]
```

### When Gemini is called

Gemini is called **once when the user leaves chat** — not when each notification is sent.
All 3 notifications are generated in a single API call and stored in Firestore.
The Cloud Function that sends at +3h, +12h, +24h just reads pre-stored text — no AI cost at send time.

### Fallback if Gemini fails

If the Gemini API call fails (timeout, quota exceeded, network error), the system
falls back to per-character template strings that still reference the character name
and are personalised enough to not feel robotic. The cycle continues uninterrupted.

---

## 7. Firestore Data Structure

```
users/
  {uid}/
    pushToken:          string       ← FCM device token (updated on every app open)
    lastChatAt:         Timestamp    ← last time user sent a message
    lastAppOpenAt:      Timestamp    ← last time user opened the app
    lastMessages:       string[]     ← rolling window of last 7 user messages
    lastCharacterId:    string       ← character from most recent chat
    lastCharacterName:  string
    userName:           string
    notifyCount:        number       ← 0, 1, 2, or 3
    nextNotifyAt:       Timestamp    ← when to fire the next notification (null if count = 3)
    expireAt:           Timestamp    ← TTL field — set to lastAppOpenAt + 10 days
    pendingNotifications:
      n1: { title: string, body: string }   ← pre-generated by Gemini
      n2: { title: string, body: string }
      n3: { title: string, body: string }

conversations/
  {uid}_{characterId}/
    lastMessageAt:  Timestamp
    expireAt:       Timestamp    ← TTL field — auto-deleted after 10 days inactive
    messages/       (subcollection)
      {autoId}/
        role:       "user" | "companion"
        text:       string
        createdAt:  Timestamp
```

---

## 8. Auto-Delete Inactive Users (Firestore TTL)

### What it does

Users who have not opened the app for 10 days have all their Firestore data
automatically deleted. This keeps storage costs low and respects user privacy.

### How Firestore TTL works

Every time the user opens the app OR sends a message, the `expireAt` field is
refreshed to `now + 10 days`. When Firestore detects `expireAt < now`, it
automatically deletes the document and all its subcollections.

```
User opens app daily:
  expireAt keeps getting pushed forward → data never deleted

User stops using app:
  expireAt stops refreshing
  10 days pass → Firestore auto-deletes users/{uid} and conversations/{uid}_*
```

### Cost of TTL deletes

Firestore TTL deletions are **free** — they do not count toward your daily
delete quota. This is the most cost-efficient cleanup strategy available.

### What gets deleted vs what stays

```
DELETED (after 10 days inactive):
  ✅ users/{uid}                       ← profile, token, notification state
  ✅ conversations/{uid}_{charId}/     ← all chat history

NOT DELETED:
  ❌ Firebase Auth account             ← stays (anonymous sessions expire on their own)
                                         Google-linked accounts stay in Auth indefinitely
```

### Setting up TTL in Firebase Console

```
Firebase Console → Firestore → Indexes → Single field TTL policies
→ Collection: users         Field: expireAt    → Enable TTL
→ Collection: conversations Field: expireAt    → Enable TTL
```

One-time setup. Firebase handles everything automatically forever after.

---

## 9. Cost Summary

### At 5,000 Daily Active Users (70K total installs)

| Service | What it covers | Monthly cost |
|---|---|---|
| Firestore writes | Saving messages + metadata | $9.70 |
| Firestore reads | Loading chat history | $4.14 |
| Firestore storage | Accumulated messages | $0.50 |
| Cloud Functions | Scheduled notification sender | $0.00 |
| FCM | Delivering all push notifications | $0.00 |
| Gemini 2.0 Flash | Generating contextual notification text | $0.83 |
| **Total** | | **~$15.17/month** |

### Revenue vs infrastructure cost

```
250 paid users × $9.99/month = $2,497 monthly revenue
Total infrastructure          =    $15 monthly cost
Firebase + Gemini             =  0.6% of revenue
```

### Free quotas that apply even on Blaze plan (daily)

```
Firestore reads:   50,000 / day   (free)
Firestore writes:  20,000 / day   (free)
Cloud Functions:   2,000,000 invocations / month (free)
FCM:               Unlimited (always free)
Gemini 2.0 Flash:  1,500 requests / day (free)
```

---

## Implementation Order

| Step | What | Status |
|---|---|---|
| 1 | `lib/firestore.js` — message read/write helpers | Pending |
| 2 | `chat/[id].js` — save messages + rolling 7-message window | Pending |
| 3 | `lib/gemini.js` — generate 3 notifications on session end | Pending |
| 4 | `lib/notifications.js` — request permission + save FCM token | Pending |
| 5 | `_layout.js` — register token after auth | Pending |
| 6 | `app.json` — expo-notifications plugin | Pending |
| 7 | `functions/index.js` — Cloud Function scheduled sender | Pending |
| 8 | `functions/templates.js` — fallback templates per character | Pending |
| 9 | Firebase Console — TTL policies on users + conversations | Pending |
| 10 | Firebase Console — FCM test + first manual campaign | Pending |
