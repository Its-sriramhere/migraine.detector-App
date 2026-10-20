import type { Device, DeviceRegistration } from "../types";
import { api } from "./api";

export function getDevices() {
  return api.get<Device[]>("/devices");
}

export function registerDevice(body: DeviceRegistration) {
  return api.post<Device>("/devices/register", body);
}

export function getDeviceStatus(deviceId: number) {
  return api.get<Device>(`/devices/${deviceId}/status`);
}
