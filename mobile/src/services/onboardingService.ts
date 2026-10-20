import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * First-run flag for the onboarding deck.
 *
 * The splash screen routes to Onboarding the first time a signed-in user
 * opens the app, and straight to the main tabs on every later launch.
 */
const KEY = "mg_onboarding_seen_v2";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    // Best effort — a failed write only means onboarding shows again.
  }
}
