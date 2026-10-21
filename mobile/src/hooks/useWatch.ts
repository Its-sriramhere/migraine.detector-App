import { useCallback, useEffect, useRef, useState } from "react";
import {
  watchService,
  type AlertLevel,
  type DiscoveredWatch,
  type Vitals,
  type WatchInfo,
} from "../services/watchService";
import { createSimulatedWatch } from "../services/ble/simulatedWatch";

export type WatchConnectionState =
  | "unavailable"
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected";

/**
 * React wrapper around the watch service. `simulated` swaps the real BLE
 * link for the built-in simulator so the app is testable without hardware
 * (and inside Expo Go, which has no BLE native module).
 */
export function useWatch(options?: { simulated?: boolean }) {
  const simulated = options?.simulated ?? false;
  const [state, setState] = useState<WatchConnectionState>(
    simulated ? "connecting" : "disconnected",
  );
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [info, setInfo] = useState<WatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<DiscoveredWatch[]>([]);
  const cleanup = useRef<(() => void) | null>(null);
  const simulator = useRef<ReturnType<typeof createSimulatedWatch> | null>(null);

  useEffect(() => {
    let active = true;
    if (!simulated) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setVitals(null); setInfo(null); setDevices([]);
        setState(watchService.available ? "disconnected" : "unavailable");
        setError(watchService.available ? null : watchService.unavailableReason);
      });
      return () => { active = false; cleanup.current?.(); watchService.disconnect(); };
    }
    const watch = createSimulatedWatch();
    simulator.current = watch;
    watch.connect().then(() => {
      if (!active) return;
      setInfo(watch.info());
      setState("connected");
      setError(null);
      cleanup.current = watch.subscribe(setVitals);
      watch.emit();
    });
    return () => {
      active = false;
      cleanup.current?.();
      cleanup.current = null;
      simulator.current = null;
      watch.disconnect();
    };
  }, [simulated]);

  /** Push a fresh set of simulated readings straight away. */
  const syncSimulated = useCallback(async () => {
    const watch = simulator.current;
    if (!watch) return;
    setInfo(watch.info());
    setState("connected");
    setError(null);
    watch.emit();
  }, []);

  const scan = useCallback(async () => {
    setState("scanning");
    setError(null);
    try {
      const found = await watchService.scan();
      setDevices(found);
      setState("disconnected");
      if (found.length === 0) {
        setError("No wearable found nearby. Make sure it is awake and advertising.");
      }
      return found;
    } catch (e) {
      setState("disconnected");
      setError(e instanceof Error ? e.message : "Bluetooth scan failed.");
      return [];
    }
  }, []);

  const connect = useCallback(
    async (id: string) => {
      setState("connecting");
      setError(null);
      try {
        await watchService.connect(id);
        await watchService.startStream();
        setInfo(await watchService.readInfo());
        setState("connected");
        cleanup.current = watchService.onVitals(setVitals);
        return true;
      } catch (e) {
        setState("disconnected");
        setError(e instanceof Error ? e.message : "Could not connect to the wearable.");
        return false;
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    watchService.disconnect();
    setState("disconnected");
    setVitals(null);
  }, []);

  const sendAlert = useCallback(async (level: AlertLevel) => {
    if (simulated) return true;
    return watchService.sendAlert(level);
  }, [simulated]);

  return {
    state,
    vitals,
    info,
    error,
    devices,
    setError,
    scan,
    connect,
    disconnect,
    syncSimulated,
    sendAlert,
    available: simulated || watchService.available,
    unavailableReason: watchService.unavailableReason,
  };
}
