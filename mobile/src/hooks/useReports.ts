import { useCallback, useEffect, useState } from "react";
import type { ReportOverview } from "../types";
import * as reportService from "../services/reportService";

export function useReports(autoLoad = true) {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await reportService.getReportOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void load();
  }, [autoLoad, load]);

  return { overview, loading, error, reload: load };
}
