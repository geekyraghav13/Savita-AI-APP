import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// ── Request permission + save raw FCM token to Firestore ─────────────────────
// Called after auth resolves. Safe to call multiple times (idempotent).
export async function registerPushToken(uid) {
  if (!uid || !db) return;

  // Android 13+ requires explicit permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('savita_retention', {
      name:       'Savita Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9d4edd',
    });
  }

  try {
    // Raw FCM token — used directly by Firebase Admin SDK in Cloud Functions
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const pushToken = tokenData.data;

    await setDoc(doc(db, 'users', uid), { pushToken }, { merge: true });
  } catch (err) {
    console.warn('[Notifications] Could not get FCM token:', err.message);
  }
}

// ── Listen for notification taps (foreground + background) ───────────────────
// Returns a cleanup function — call it in useEffect return.
export function addNotificationResponseListener(onTap) {
  const sub = Notifications.addNotificationResponseReceivedListener(onTap);
  return () => sub.remove();
}
