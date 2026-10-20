import type { ReportOverview } from "../types";
import { api } from "./api";

export function getReportOverview() {
  return api.get<ReportOverview>("/reports/overview");
}

export const CSV_EXPORTS = [
  {
    key: "predictions",
    label: "Predictions CSV",
    path: "/reports/predictions.csv",
    filename: "predictions.csv",
  },
  {
    key: "episodes",
    label: "Episodes CSV",
    path: "/reports/episodes.csv",
    filename: "episodes.csv",
  },
  {
    key: "dataset",
    label: "Full dataset CSV",
    path: "/dataset/export.csv",
    filename: "migraine-dataset.csv",
  },
] as const;
