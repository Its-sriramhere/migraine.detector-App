import type { Explanation, Prediction } from "../types";
import { api } from "./api";

export function getCurrentPrediction() {
  return api.get<Prediction>("/predictions/current");
}

export function getPredictionHistory(limit = 40) {
  return api.get<Prediction[]>(`/predictions/history?limit=${limit}`);
}

export function getExplanation(predictionId: number) {
  return api.get<Explanation>(`/predictions/${predictionId}/explanation`);
}
