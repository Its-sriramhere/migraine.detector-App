import { useCallback, useEffect, useState } from "react";
import type { Alert, AlertFeedback, NotificationLogsResponse } from "../types";
import * as alertService from "../services/alertService";

export function useAlerts(autoLoad = true) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sms, setSms] = useState<NotificationLogsResponse | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, logs] = await Promise.all([
        alertService.getAlerts(50).catch(() => [] as Alert[]),
        alertService.getNotificationLogs(20).catch(() => null),
      ]);
      setAlerts(list);
      setSms(logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void load();
  }, [autoLoad, load]);

  const acknowledge = useCallback(async (id: number) => {
    setAlerts((cur) =>
      cur.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
    try {
      await alertService.acknowledgeAlert(id);
    } catch {
      void load();
    }
  }, [load]);

  const feedback = useCallback(
    async (id: number, value: AlertFeedback) => {
      setAlerts((cur) =>
        cur.map((a) =>
          a.id === id
            ? { ...a, acknowledged: true, feedback: value }
            : a,
        ),
      );
      try {
        await alertService.submitAlertFeedback(id, value);
      } catch {
        void load();
      }
    },
    [load],
  );

  return { alerts, sms, loading, error, reload: load, acknowledge, feedback };
}
