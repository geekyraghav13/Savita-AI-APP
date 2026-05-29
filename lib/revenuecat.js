import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import { REVENUECAT_ANDROID_KEY } from '../secrets';

export const PREMIUM_ENTITLEMENT = 'premium';

// Product IDs — must match Google Play Console exactly
export const PRODUCT_IDS = {
  weekly:   'savita_weekly',
  yearly:   'savita_yearly',
  lifetime: 'savita_lifetime',
};

// RevenueCat package type identifiers
export const PACKAGE_TYPES = {
  weekly:   '$rc_weekly',
  yearly:   '$rc_annual',
  lifetime: '$rc_lifetime',
};

export function initRevenueCat(userId = null) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });

  if (userId) {
    Purchases.logIn(userId).catch(() => {});
  }
}

export async function checkPremiumStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isPremiumActive(customerInfo);
  } catch {
    return false;
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return isPremiumActive(customerInfo);
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return isPremiumActive(customerInfo);
}

// Always shows the RevenueCat paywall (used for PRO badge taps).
// Returns true if user purchased or restored.
export async function showPaywallAlways() {
  try {
    const result = await RevenueCatUI.presentPaywall();
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  } catch {
    return false;
  }
}

// Shows paywall only when user doesn't already have premium
// (used for message limit / call intercept).
export async function showPaywall() {
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT,
    });
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  } catch {
    return false;
  }
}

function isPremiumActive(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT];
}
