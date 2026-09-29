import type {
  DemoSessionStatus,
  Device,
  ReadingWithPrediction,
  ScenarioName,
  SensorReading,
} from "../types";
import { api } from "./api";

export function getLatestReading() {
  return api.get<SensorReading>("/sensor/latest");
}

export function getSensorHistory(limit = 100) {
  return api.get<SensorReading[]>(`/sensor/history?limit=${limit}`);
}

export function getDevices() {
  return api.get<Device[]>("/devices");
}

export function getDeviceStatus(deviceId: number) {
  return api.get<Device>(`/devices/${deviceId}/status`);
}

export function getDemoStatus() {
  return api.get<DemoSessionStatus>("/demo/status");
}

export function sendScenario(scenario: ScenarioName) {
  return api.post<ReadingWithPrediction>("/demo/scenario", { scenario });
}

export function startDemo(scenario: ScenarioName) {
  return api.post<DemoSessionStatus & Partial<ReadingWithPrediction>>(
    "/demo/start",
    { scenario },
  );
}

export function stopDemo() {
  return api.post<DemoSessionStatus>("/demo/stop");
}
