# SAVITA AI — 10-Day Production Sprint

## Project Summary

AI girlfriend/companion app built with Expo 54 (React Native 0.81.5), Expo Router 6, Firebase (JS SDK), RevenueCat, and i18next. Primary target is Android; iOS kept compatible throughout.

**Core UX philosophy:** Delay all auth and paywall friction until the user has emotionally invested in personalizing their companion. The 7-second call intercept is the primary monetization trigger.

---

## Stack

| Concern | Choice |
| :--- | :--- |
| Framework | Expo 54 + React Native 0.81.5 |
| Navigation | Expo Router 6 (file-based) |
| State | Zustand |
| Backend | Firebase JS SDK (Firestore + Auth) |
| Payments | RevenueCat (`react-native-purchases`) |
| i18n | i18next + expo-localization |
| AI | TBD — decide on Day 7 (OpenRouter currently wired) |
| Video | expo-video |
| Animations | react-native-reanimated |

---

## Theme Tokens (Dark Premium)

| Token | Value |
| :--- | :--- |
| Background deep | `#0d0d1a` |
| Background surface | `#16162a` |
| Background card | `#1e1e3a` |
| Purple accent | `#7c3aed` |
| Purple light | `#a78bfa` |
| Gold accent | `#d4af37` |
| Text primary | `#ffffff` |
| Text secondary | `#a0a0c0` |
| Border | `#2a2a4e` |

---

## Languages

English, Hindi, Portuguese, German, French, Spanish, Turkish, Japanese, Vietnamese

---

## Subscription Plans

Weekly / Monthly / Yearly via RevenueCat. Pricing to be decided on Day 8.

---

## App Flow

```
[Cold Launch]
      │
      ▼
[Splash Screen]          ← check cached token, RevenueCat status, prefetch characters
      │
      ▼
[Onboarding Slider]      ← 4 slides: voice calls / instant chat / personalization / premium avatars
      │
      ▼
[Intro Video Screen]     ← full-screen expo-video from Firebase Storage, "Get Started" CTA
      │
      ▼
[Language Selection]     ← sets i18next locale, 9 language options
      │
      ▼
[Character Carousel]     ← horizontal scroll, tap morphs background to full portrait
      │                     free → proceed | isPremium + no sub → open Paywall
      ▼
[Name Customization]     ← pre-filled with character default, user can override
      │
      ▼
[Hobbies Selection]      ← pill grid, min 1 required
      │
      ▼
[Interests Selection]    ← pill grid, min 1 required
      │
      ▼
[Identity Check]
      ├── not authenticated ──► [Login Gateway: Google / Apple / Guest]
      └── authenticated ──────► skip
      │
      ▼
[Configuration Summary]  ← character portrait + name + hobbies + interests chips
      │ "Start Chatting"
      ▼
[Chat Screen]            ← 10 free messages, dynamic system prompt, audio call button
      │ at 7 seconds elapsed (first session only)
      ▼
[Incoming Call Popup]    ← simulated call from companion
      │ Accept / Decline / Missed
      ▼
[Paywall Screen]         ← Weekly / Monthly / Yearly
      │
      ▼ (back button or paywall close)
[Chat History Dashboard] ← list of past companions, account controls
      │
      ▼ ("+ SELECT NEW GIRLFRIEND" bottom anchor)
[Character Carousel]     ← loop resets, auth step skipped for returning users
```

---

## Route Structure

```
app/
├── _layout.js                    ← root layout, font load, splash control
├── (onboarding)/
│   ├── _layout.js
│   ├── splash.js
│   ├── slider.js
│   ├── video.js
│   └── language.js
├── (character)/
│   ├── _layout.js
│   ├── carousel.js
│   ├── name.js
│   ├── hobbies.js
│   └── interests.js
├── (auth)/
│   ├── _layout.js
│   └── gateway.js
├── (main)/
│   ├── _layout.js
│   ├── summary.js
│   ├── chat/
│   │   └── [id].js
│   ├── dashboard.js
│   └── paywall.js
```

---

## Zustand Store Shape

```js
{
  // i18n
  language: 'en',

  // character creation flow
  selectedCharacter: null,     // Firestore character doc
  customName: '',
  hobbies: [],                 // string[]
  interests: [],               // string[]

  // auth
  user: null,                  // Firebase user object

  // subscription
  isPremium: false,

  // chat
  activeCompanionId: null,
  messageCount: 0,             // resets per companion session

  // actions
  setLanguage, setCharacter, setCustomName,
  setHobbies, setInterests,
  setUser, setIsPremium,
  setActiveCompanion, incrementMessageCount, resetMessageCount,
}
```

---

## Firestore Collections

```
characters/              ← {id, name, role, description, systemPrompt, avatarUrl, isPremium, colorHex}
users/{uid}/
  profile               ← {displayName, email, language, createdAt}
  companions/{id}       ← {characterId, customName, hobbies, interests, createdAt, lastMessageAt}
  messages/{companionId}/thread/{msgId}  ← {role, content, timestamp}
```

---

## Daily Breakdown

### Day 1 — Architecture & Foundation ✅ DONE
**Goal:** Restructure project, install all dependencies, define theme and state.

- [x] Create route group folders: `(onboarding)`, `(character)`, `(auth)`, `(main)`
- [x] Install: `zustand`, `i18next`, `react-i18next`, `expo-localization`, `react-native-reanimated`, `lucide-react-native`
- [x] Create `store/useAppStore.js` with the full Zustand shape above
- [x] Create `constants/theme.js` with all theme tokens
- [x] Create `locales/` folder with `en.json` as the base translation file
- [x] Verify the app still runs after restructure

---

### Day 2 — Firebase SDK & Authentication ✅ DONE
**Goal:** Wire backend and auth providers.

- [x] Install Firebase JS SDK: `firebase`
- [x] Create `lib/firebase.js` — initialize app, export `auth`, `db` (Firestore) — graceful no-op if config is placeholder
- [x] Create `useGoogleSignIn` hook (ready, activates when Firebase credentials added to secrets.js)
- [x] Create `useAuthListener` hook → writes Firebase user into Zustand on state change
- [x] Guest mode working without Firebase
- [ ] Google Sign-In — wire when Firebase project credentials added to `secrets.js`

---

### Day 3 — Splash, Onboarding Slider, Intro Video ✅ DONE
**Goal:** Build the first three screens users see.

- [x] **Splash Screen** (`(onboarding)/splash.js`): custom design — silhouette logo, SVG gradient title, feature cards, pulsing mic button, 3.5s auto-advance
- [x] **Onboarding Slider** (`(onboarding)/slider.js`): full-screen MP4 video background, Next button fades in at 4s, white glow button
- [ ] **Intro Video Screen** (`(onboarding)/video.js`): deferred — wire Firebase Storage URL when ready, currently skipped in flow

---

### Day 4 — Language Selector & Character Carousel ✅ DONE
**Goal:** Let the user pick their language and companion.

- [x] **Language Selection** (`(onboarding)/language.js`): clean grid of 9 flags/language labels, sets `i18next.changeLanguage()` + Zustand
- [x] **Character Carousel** (`(character)/carousel.js`): horizontal scroll, circular thumbnails, tapping crossfades full-screen background to that character's portrait (Reanimated two-layer dissolve)
- [x] Premium lock badge UI — `Gem` icon + dark overlay for `isPremium: true` characters
- [x] Paywall intercept: locked character + Continue → `(main)/paywall`
- [x] **Images stored locally** — 8 characters in `assets/images/characters/`, data in `constants/characters.js` (Firestore sync deferred; not needed unless remote updates required)
- [x] 4 free characters (Chloe, Maya, Mia, Harper) + 4 premium (Aisha, Hana, Jasmine, Rin)

---

### Day 5 — Personalization Wizard ✅ DONE
**Goal:** Capture name, hobbies, and interests into Zustand.

- [x] **Name Screen** (`(character)/name.js`): TextInput pre-filled with `selectedCharacter.name`, gold underline, validation (min 2 chars), i18n
- [x] **Hobbies Screen** (`(character)/hobbies.js`): pill grid, multi-select, min 1 required, Continue disabled until valid, i18n
- [x] **Interests Screen** (`(character)/interests.js`): same pill grid, routes to gateway (no user) or dashboard (authenticated), i18n
- [x] All selections write directly to Zustand
- [x] All 9 languages fully translated (en/hi/pt/de/fr/es/tr/ja/vi) — UI strings + all pill labels
- [x] `lib/i18n.js` updated to load all 9 locales
- [x] Carousel premium bypass — any character proceeds to name screen

---

### Day 6 — Auth Gate & Configuration Summary
**Goal:** Handle returning vs new users, then confirm the companion setup.

- [ ] **Identity Check** (logic in `(character)/interests.js` `onContinue`): read Zustand `user` — if null, navigate to `(auth)/gateway`; else skip to summary
- [ ] **Login Gateway** (`(auth)/gateway.js`): high-conversion screen, Google / Apple / Guest buttons, "Continue without account" for Guest
- [ ] **Configuration Summary** (`(main)/summary.js`): character portrait (large), custom name, hobbies chips, interests chips, "Start Chatting →" button
- [ ] On "Start Chatting": write `users/{uid}/companions/{id}` doc to Firestore → navigate to `(main)/chat/[id]`

---

### Day 7 — Chat Screen & AI Integration
**Goal:** Build the core messenger and wire the AI with dynamic context.

- [ ] **Chat UI** (`(main)/chat/[id].js`): FlatList messages, typing indicator, character name + presence dot in header, Audio Call button (tap → triggers call popup)
- [ ] **System prompt builder**: `buildSystemPrompt(character, customName, hobbies, interests, language)` → single function that composes rich context
- [ ] **10-message limit**: after 10 messages, TextInput becomes non-editable, banner slides up linking to Paywall
- [ ] **AI client decision**: finalize here — keep OpenRouter or switch to Gemini. Wire selected client to system prompt builder.
- [ ] Messages persist to Firestore `messages/{companionId}/thread/`

---

### Day 8 — RevenueCat & The 7-Second Intercept
**Goal:** Drive subscriptions with the core monetization mechanic.

- [ ] Install `react-native-purchases`, initialize RevenueCat in `lib/revenuecat.js`
- [ ] Fetch offerings on app start, write `isPremium` to Zustand via `useCustomerInfo` listener
- [ ] **Paywall Screen** (`(main)/paywall.js`): character portrait backdrop, 3 plan cards (Weekly / Monthly / Yearly), purchase handler, restore purchases link
- [ ] **7-Second Timer**: on first chat session entry (new companion only), start a 7000ms timer. On fire → show `IncomingCallModal`
- [ ] **IncomingCallModal**: full-screen overlay, character avatar pulsing with ring animation, Accept (green) / Decline (red) buttons + auto-dismiss to "missed call" after 8s
- [ ] All three outcomes (Accept / Decline / Missed) → navigate to Paywall

---

### Day 9 — Dashboard & Companion Loop
**Goal:** Build the history view and close the engagement loop.

- [ ] **Chat History Dashboard** (`(main)/dashboard.js`): vertical list of `user_companions` sorted by `lastMessageAt`, each row shows character portrait + custom name + last message preview
- [ ] Header: account settings icon, subscription badge, logout, delete account
- [ ] Back button from `chat/[id]` → navigates to `dashboard`, not app exit (override Android back handler)
- [ ] **Bottom Anchor** `+ SELECT NEW GIRLFRIEND`: full-width button, fixed to bottom of dashboard, tapping clears `selectedCharacter`/`customName`/`hobbies`/`interests` from Zustand → navigates to Character Carousel. Auth step skipped entirely for logged-in users.

---

### Day 10 — Hardening & Release
**Goal:** Production-ready build.

- [ ] RevenueCat: run full purchase + restore flow in Google Play Billing sandbox
- [ ] Move all API keys to `EXPO_PUBLIC_` env vars, remove from `secrets.js` / `config.js`
- [ ] Profile chat FlatList with 100+ messages — verify no janky scroll or memory issues
- [ ] i18n QA: spot-check all 9 languages on key screens (onboarding, carousel, chat, paywall)
- [ ] Final signed APK + AAB build (`expo run:android --variant release`)
- [ ] Verify signing with existing `savita-release-key.jks`

---

## Working Method

We go **one screen at a time**. Before building each screen, share a reference image or UI sketch if you have one. I will build it, then you test it on device before we move to the next screen.

**Current status: Ready to start Day 1.**
