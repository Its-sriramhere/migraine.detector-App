import type { MigraineEpisode } from "../types";
import { api } from "./api";

export interface MigraineInput {
  start_time: string;
  end_time?: string;
  severity?: string;
  symptoms: string[];
  trigger?: string;
  notes?: string;
}

export function getMigraineHistory() {
  return api.get<MigraineEpisode[]>("/migraine/history");
}

export function logMigraine(body: MigraineInput) {
  return api.post<MigraineEpisode>("/migraine", body);
}
