import { Platform } from "react-native";
import { riskColors } from "../constants/colors";
import type { RiskLevel } from "../types";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null = null;
let unavailable = false;

/**
 * expo-notifications is loaded lazily and defensively: some Expo Go builds
 * ship without the notification native modules, and a missing optional
 * feature must never take the whole app down. Notifications are treated as
 * a best-effort enhancement.
 */
async function loadNotifications(): Promise<NotificationsModule | null> {
  if (unavailable) return null;
  if (cached) return cached;
  try {
    const mod = await import("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
    return mod;
  } catch {
    unavailable = true;
    return null;
  }
}

export async function notificationsAvailable(): Promise<boolean> {
  return (await loadNotifications()) !== null;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await N.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Local notification for risk-level increases.
 * Text is deliberately non-alarming and never states that a migraine
 * will occur (health-UX rules).
 */
export async function notifyRiskIncreased(
  level: RiskLevel,
  score: number,
): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  const rc = riskColors(level);
  try {
    await N.scheduleNotificationAsync({
      content: {
        title: "Migraine Risk Alert",
        body: `Your current calculated migraine-risk level has increased to ${level.toUpperCase()} (${Math.round(score)}%). Open the app to view the contributing factors.`,
        data: { level, score },
        color: rc.indicator,
      },
      trigger: null,
    });
  } catch {
    // notifications are best-effort
  }
}

export function notificationChannelHint(): string {
  return Platform.OS === "android"
    ? "Android 13+ asks for notification permission the first time."
    : "Allow notifications in iOS Settings to receive risk alerts.";
}
