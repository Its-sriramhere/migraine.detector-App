import type { Alert, AlertFeedback, NotificationLogsResponse } from "../types";
import { api } from "./api";

export function getAlerts(limit = 50) {
  return api.get<Alert[]>(`/alerts?limit=${limit}`);
}

export function getNotificationLogs(limit = 20) {
  return api.get<NotificationLogsResponse>(`/alerts/notifications?limit=${limit}`);
}

export function acknowledgeAlert(alertId: number) {
  return api.post<Alert>(`/alerts/${alertId}/acknowledge`);
}

export function submitAlertFeedback(alertId: number, feedback: AlertFeedback) {
  return api.post<Alert>(`/alerts/${alertId}/feedback`, { feedback });
}
