import { getBleManager, bleUnavailableReason } from "./ble/bleClient";
import { PermissionsAndroid, Platform } from "react-native";
import { api } from "./api";
import {
  ALERT_CHAR_UUID,
  CONTROL,
  CONTROL_CHAR_UUID,
  INFO_CHAR_UUID,
  SLEEP_CHAR_UUID,
  VITALS_CHAR_UUID,
  WATCH_SERVICE_UUID,
  bytesToBase64,
  decodeInfo,
  decodeSleep,
  decodeVitals,
  encodeAlert,
  encodeControl,
  type AlertLevel,
  type SleepNight,
  type Vitals,
  type WatchInfo,
} from "./ble/watchProtocol";
import type { Device } from "../types";

export interface DiscoveredWatch {
  id: string;
  name: string;
  rssi: number;
}

/**
 * Owns the BLE link to the wearable: scanning, connecting, subscribing to
 * the vitals stream and writing risk alerts back to the watch.
 */
class WatchService {
  private device: import("react-native-ble-plx").Device | null = null;
  private listeners = new Set<(v: Vitals) => void>();
  private subscription: { remove: () => void } | null = null;

  get available(): boolean {
    return getBleManager() !== null;
  }

  get unavailableReason(): string | null {
    return bleUnavailableReason();
  }

  get connected(): boolean {
    return this.device !== null;
  }

  /** Scan for nearby watches advertising our service (or standard HRS). */
  async scan(timeoutMs = 8000): Promise<DiscoveredWatch[]> {
    if (Platform.OS === "android") {
      const permissions = Number(Platform.Version) >= 31
        ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      if (permissions.some((permission) => granted[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
        throw new Error("Allow Nearby devices permission in Android Settings to scan for wearables.");
      }
    }
    const manager = getBleManager();
    if (!manager) throw new Error(this.unavailableReason ?? "Bluetooth is unavailable on this device.");
    const state = await manager.state();
    if (state !== "PoweredOn") throw new Error(state === "Unsupported" ? "This device does not support Bluetooth LE. Use the simulated wearable for testing." : "Turn on Bluetooth before scanning for wearables.");
    const found = new Map<string, DiscoveredWatch>();
    await manager.startDeviceScan(
      [WATCH_SERVICE_UUID, "0000180d-0000-1000-8000-00805f9b34fb"],
      { allowDuplicates: false },
      (error, peripheral) => {
        if (error || !peripheral) return;
        found.set(peripheral.id, {
          id: peripheral.id,
          name: peripheral.localName ?? peripheral.name ?? "Wearable",
          rssi: peripheral.rssi ?? 0,
        });
      },
    );
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await manager.stopDeviceScan().catch(() => undefined);
    return [...found.values()];
  }

  async connect(id: string): Promise<void> {
    const manager = getBleManager();
    if (!manager) {
      throw new Error(this.unavailableReason ?? "Bluetooth unavailable");
    }
    const device = await manager.connectToDevice(id, { timeout: 12000 });
    await device.discoverAllServicesAndCharacteristics();
    this.device = device;
    await this.subscribeVitals();
  }

  private async subscribeVitals(): Promise<void> {
    const device = this.device;
    if (!device) return;
    try {
      const characteristics = await device.characteristicsForService(
        WATCH_SERVICE_UUID,
      );
      if (!characteristics.some((c) => c.uuid === VITALS_CHAR_UUID)) return;
      this.subscription = device.monitorCharacteristicForService(
        WATCH_SERVICE_UUID,
        VITALS_CHAR_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const parsed = decodeVitals(characteristic.value);
          if (parsed) this.listeners.forEach((cb) => cb(parsed));
        },
      );
    } catch {
      // characteristic not present on this firmware revision
    }
  }

  async readInfo(): Promise<WatchInfo | null> {
    const device = this.device;
    if (!device) return null;
    try {
      const characteristic = await device.readCharacteristicForService(
        WATCH_SERVICE_UUID,
        INFO_CHAR_UUID,
      );
      return decodeInfo(characteristic.value ?? "");
    } catch {
      return null;
    }
  }

  /** Read the last night of sleep the wearable recorded, if it reports it. */
  async readSleep(): Promise<SleepNight | null> {
    const device = this.device;
    if (!device) return null;
    try {
      const characteristic = await device.readCharacteristicForService(
        WATCH_SERVICE_UUID,
        SLEEP_CHAR_UUID,
      );
      return decodeSleep(characteristic.value ?? "");
    } catch {
      // characteristic not present on this firmware revision
      return null;
    }
  }

  /** Push a risk alert so the watch can vibrate. */
  async sendAlert(level: AlertLevel, durationMs = 8000): Promise<boolean> {
    const device = this.device;
    if (!device) return false;
    try {
      await device.writeCharacteristicWithResponseForService(
        WATCH_SERVICE_UUID,
        ALERT_CHAR_UUID,
        bytesToBase64(encodeAlert(level, durationMs)),
      );
      return true;
    } catch {
      return false;
    }
  }

  async startStream(rateHz = 1): Promise<void> {
    const device = this.device;
    if (!device) return;
    try {
      await device.writeCharacteristicWithResponseForService(
        WATCH_SERVICE_UUID,
        CONTROL_CHAR_UUID,
        bytesToBase64(encodeControl(CONTROL.START_STREAM, rateHz)),
      );
    } catch {
      // ignore
    }
  }

  onVitals(cb: (v: Vitals) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  disconnect(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.listeners.clear();
    const device = this.device;
    this.device = null;
    if (device) void device.cancelConnection().catch(() => undefined);
  }
}

export const watchService = new WatchService();
export type { Vitals, WatchInfo, AlertLevel };

/** Watches registered with the backend so readings can be attributed. */
export function getRegisteredWatches() {
  return api.get<Device[]>("/devices");
}

export function registerWatch(deviceIdentifier: string, deviceName: string) {
  return api.post<Device>("/devices/register", {
    device_identifier: deviceIdentifier,
    device_name: deviceName,
  });
}
