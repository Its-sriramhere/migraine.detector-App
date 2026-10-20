import type {
  DatasetsResponse,
  PipelineResult,
  ThresholdsResponse,
} from "../types";
import { api } from "./api";

export function getDatasets() {
  return api.get<DatasetsResponse>("/datasets");
}

export function getThresholds() {
  return api.get<ThresholdsResponse>("/datasets/thresholds");
}

export function rebuildCalibrationDataset() {
  return api.post<PipelineResult>("/datasets/build");
}

export function recalibrateThresholds() {
  return api.post<PipelineResult>("/datasets/calibrate", {
    file: "calibration.csv",
    label_col: "episode",
  });
}

export function datasetDownloadPath(filename: string) {
  return `/datasets/download/${encodeURIComponent(filename)}`;
}
