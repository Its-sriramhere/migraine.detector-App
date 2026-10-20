import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "../constants/config";
import type {
  Alert,
  AlertFeedback,
  Device,
  Prediction,
  SensorReading,
  WsEvent,
} from "../types";
import { getToken } from "../services/api";
import * as riskService from "../services/riskService";
import * as sensorService from "../services/sensorService";
import * as alertService from "../services/alertService";
import { openWebSocket, type WsClient } from "../services/websocketService";
import { notifyRiskIncreased } from "../services/notificationService";

export type SensorMode = "live" | "demo";

interface SensorState {
  mode: SensorMode;
  prediction: Prediction | null;
  latestReading: SensorReading | null;
  sensorHistory: SensorReading[];
  predictionHistory: Prediction[];
  devices: Device[];
  alerts: Alert[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  refresh: () => Promise<void>;
  setMode: (m: SensorMode) => void;
  acknowledgeAlert: (id: number) => void;
  sendFeedback: (id: number, value: AlertFeedback) => void;
}

export function useSensorData(
  userId: number | null,
  initialMode: SensorMode = "live",
): SensorState {
  const [mode, setMode] = useState<SensorMode>(initialMode);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(
    null,
  );
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([]);
  const [predictionHistory, setPredictionHistory] = useState<Prediction[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const client = useRef<WsClient | null>(null);
  const lastLevel = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pred, hist, reading, readings, devs, alertList] =
        await Promise.all([
          riskService.getCurrentPrediction().catch(() => null),
          riskService.getPredictionHistory(40).catch(() => [] as Prediction[]),
          sensorService.getLatestReading().catch(() => null),
          sensorService.getSensorHistory(100).catch(() => [] as SensorReading[]),
          sensorService.getDevices().catch(() => [] as Device[]),
          alertService.getAlerts(50).catch(() => [] as Alert[]),
        ]);
      if (pred) {
        setPrediction(pred);
        lastLevel.current = pred.risk_level;
      }
      setPredictionHistory(hist);
      if (reading) setLatestReading(reading);
      setSensorHistory(readings);
      setDevices(devs);
      setAlerts(alertList);
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

  // Live socket: prediction_update / alert_update.
  useEffect(() => {
    if (!userId) return;
    const socket = openWebSocket(
      userId,
      (event: WsEvent) => {
        if (event.type === "prediction_update") {
          setPrediction((prev) => {
            const next: Prediction = {
              id: prev?.id ?? 0,
              timestamp: event.timestamp,
              risk_score: event.risk_score,
              risk_level: event.risk_level as Prediction["risk_level"],
              prediction_window: event.prediction_window_minutes,
              model_version: prev?.model_version ?? "",
              outcome: prev?.outcome ?? "",
              source: prev?.source ?? "live",
              features: event.features ?? [],
              advice: event.advice,
            };
            if (
              lastLevel.current &&
              next.risk_level !== lastLevel.current &&
              event.risk_level !== "low"
            ) {
              void notifyRiskIncreased(next.risk_level, next.risk_score);
            }
            lastLevel.current = next.risk_level;
            return next;
          });
          setLastSync(new Date().toISOString());
        } else if (event.type === "alert_update") {
          const alert: Alert = {
            id: event.id,
            timestamp: event.timestamp,
            risk_score: event.risk_score,
            risk_level: event.risk_level as Alert["risk_level"],
            message: event.message,
            acknowledged: event.acknowledged,
            prediction_id: event.prediction_id ?? undefined,
            advice: event.advice,
          };
          setAlerts((cur) => [alert, ...cur.filter((a) => a.id !== alert.id)]);
          if (alert.risk_level !== "low") {
            void notifyRiskIncreased(alert.risk_level, alert.risk_score);
          }
        }
      },
      (isConnected) => setConnected(isConnected),
    );
    client.current = socket;
    return () => {
      socket.close();
      client.current = null;
    };
  }, [userId]);

  const acknowledgeAlert = useCallback((id: number) => {
    setAlerts((cur) =>
      cur.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
    void alertService.acknowledgeAlert(id).catch(() => undefined);
  }, []);

  const sendFeedback = useCallback((id: number, value: AlertFeedback) => {
    setAlerts((cur) =>
      cur.map((a) =>
        a.id === id ? { ...a, acknowledged: true, feedback: value } : a,
      ),
    );
    void alertService.submitAlertFeedback(id, value).catch(() => undefined);
  }, []);

  return {
    mode,
    prediction,
    latestReading,
    sensorHistory,
    predictionHistory,
    devices,
    alerts,
    connected,
    loading,
    error,
    lastSync,
    refresh,
    setMode,
    acknowledgeAlert,
    sendFeedback,
  };
}

/** Token presence check used by the WS effect before opening a socket. */
export async function hasToken(): Promise<boolean> {
  return !!(await getToken());
}
