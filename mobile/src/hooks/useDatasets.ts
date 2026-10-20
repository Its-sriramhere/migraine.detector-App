import { useCallback, useEffect, useState } from "react";
import type { DatasetsResponse, ThresholdsResponse } from "../types";
import * as datasetService from "../services/datasetService";

export function useDatasets(autoLoad = true) {
  const [data, setData] = useState<DatasetsResponse | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdsResponse | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, thr] = await Promise.all([
        datasetService.getDatasets().catch(() => null),
        datasetService.getThresholds().catch(() => null),
      ]);
      setData(list);
      setThresholds(thr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load datasets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void load();
  }, [autoLoad, load]);

  return { data, thresholds, loading, error, reload: load };
}
