import { Platform } from "react-native";

/**
 * react-native-ble-plx is a native module, so it is not present in Expo Go.
 * It is loaded lazily and every failure is swallowed: the app must keep
 * working (simulated watch + demo mode) when the native module is missing.
 */
type BleManager = InstanceType<
  typeof import("react-native-ble-plx").BleManager
>;

let manager: BleManager | null = null;
let unavailableReason: string | null = null;

export function bleUnavailableReason(): string | null {
  return unavailableReason;
}

export function getBleManager(): BleManager | null {
  if (manager) return manager;
  if (unavailableReason) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-ble-plx");
    const BleManager = mod.BleManager as new () => BleManager;
    manager = new BleManager();
    return manager;
  } catch {
    unavailableReason =
      Platform.OS === "android"
        ? "Bluetooth needs a development build. Run `npx expo run:android`."
        : "Bluetooth needs a development build. Run `npx expo run:ios`.";
    return null;
  }
}

export function isBleAvailable(): boolean {
  return getBleManager() !== null;
}
