import { NativeModules } from "react-native";

export interface BondedDevice {
  id: string;
  name: string;
  /** Bond state reported by the platform, e.g. "bonded". */
  type?: string;
  /** Not reported by Android; a bonded device has no live RSSI. */
  rssi?: number;
}

interface BondedDevicesModule {
  getBondedDevices(): Promise<BondedDevice[]>;
  isSupported(): boolean;
}

/**
 * The Android native module that lists the devices already bonded to the
 * phone, which is the same list the system Bluetooth settings shows.
 *
 * react-native-ble-plx cannot see bonded devices, and a bonded watch is
 * often out of range, so it would never appear in a scan.
 */
const native = NativeModules.BondedDevices as BondedDevicesModule | undefined;

export function getBondedDevicesModule(): BondedDevicesModule | null {
  if (!native?.getBondedDevices) return null;
  return native;
}
