import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "../constants/config";
import type { Device, Prediction, SensorReading } from "../types";
import { getToken } from "../services/api";
import * as riskService from "../services/riskService";
import * as sensorService from "../services/sensorService";

export type SensorMode = "live" | "demo";

interface SensorState {
  mode: SensorMode;
  prediction: Prediction | null;
  latestReading: SensorReading | null;
  devices: Device[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  refresh: () => Promise<void>;
  setMode: (m: SensorMode) => void;
}

export function useSensorData(initialMode: SensorMode = "live"): SensorState {
  const [mode, setMode] = useState<SensorMode>(initialMode);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(
    null,
  );
  const [devices, setDevices] = useState<Device[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pred, reading, devs] = await Promise.all([
        riskService.getCurrentPrediction().catch(() => null),
        sensorService.getLatestReading().catch(() => null),
        sensorService.getDevices().catch(() => [] as Device[]),
      ]);
      if (pred) setPrediction(pred);
      if (reading) setLatestReading(reading);
      setDevices(devs);
      setLastSync(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, config.refreshIntervalMs);
    return () => clearInterval(id);
  }, [refresh]);

  // WebSocket for live updates, polling fallback already via interval above.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        // userId unknown here; WS connects per-screen when user id known.
        // Kept as hook-level no-op until user id is passed in.
        void token;
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
      ws.current?.close();
    };
  }, []);

  return {
    mode,
    prediction,
    latestReading,
    devices,
    connected,
    loading,
    error,
    lastSync,
    refresh,
    setMode,
  };
}
