import { useCallback, useEffect, useState } from "react";
import type { Explanation, Prediction } from "../types";
import * as riskService from "../services/riskService";

export function useRisk(autoLoad = true) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cur, hist] = await Promise.all([
        riskService.getCurrentPrediction().catch(() => null),
        riskService.getPredictionHistory(40).catch(() => [] as Prediction[]),
      ]);
      setPrediction(cur);
      setHistory(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load risk.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void Promise.resolve().then(load);
  }, [autoLoad, load]);

  return { prediction, history, loading, error, reload: load };
}

export function useExplanation(predictionId: number | null) {
  const [data, setData] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!predictionId) return;
    void Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
      return riskService
      .getExplanation(predictionId)
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load."),
      )
      .finally(() => setLoading(false));
    });
  }, [predictionId]);

  return { data, loading, error };
}
