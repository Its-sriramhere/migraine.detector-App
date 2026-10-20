// Shared contracts — must match backend schemas. Do not drift silently.
export type RiskLevel = "low" | "moderate" | "high";

export interface User {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  consent_given: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AssessmentOption {
  label: string;
  value: string;
}

export interface AssessmentQuestion {
  id: number;
  question_text: string;
  question_type: "single" | "multi";
  options: string[];
}

export interface AssessmentAnswer {
  question_id: number;
  answer: string;
}

export interface RiskProfile {
  user_id: number;
  migraine_history_score: number;
  sleep_profile?: string;
  stress_profile?: string;
  activity_profile?: string;
  hydration_profile?: string;
  caffeine_profile?: string;
  trigger_profile: string[];
  resting_hr?: number;
  profile_version: string;
}

export interface BaselineEstimates {
  heart_rate_low: number;
  heart_rate_high: number;
  sleep_hours?: number;
  resting_note: string;
}

export interface SensorReading {
  id: number;
  source: string;
  timestamp?: string;
  heart_rate?: number;
  hrv?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  activity?: number;
  signal_quality?: number;
}

export interface SensorData {
  heart_rate: number;
  spo2: number;
  temperature: number;
  hrv: number;
  motion: number;
}

export interface PredictionFeature {
  id: number;
  feature_name: string;
  feature_value?: number;
  contribution: number;
}

export interface Prediction {
  id: number;
  timestamp?: string;
  risk_score: number;
  risk_level: RiskLevel;
  prediction_window: number;
  model_version: string;
  outcome: string;
  source: string;
  features: PredictionFeature[];
  advice?: string[];
}

export interface RiskResult {
  risk_score: number;
  risk_level: RiskLevel;
  timestamp: string;
}

export interface Explanation {
  prediction_id: number;
  risk_score: number;
  risk_level: RiskLevel;
  features: { name: string; value?: number; contribution: number }[];
}

export interface ReadingWithPrediction {
  reading: SensorReading;
  prediction: Prediction;
}

export interface Device {
  id: number;
  device_identifier: string;
  device_name: string;
  status: string;
  last_seen?: string;
}

export interface DeviceRegistration {
  device_identifier: string;
  device_name: string;
}

export type AlertFeedback = "yes" | "no" | "not_sure";

export interface Alert {
  id: number;
  timestamp?: string;
  risk_score: number;
  risk_level: RiskLevel;
  message: string;
  acknowledged: boolean;
  feedback?: string;
  prediction_id?: number;
  advice?: string[];
}

export type NotificationStatus =
  | "sent"
  | "skipped"
  | "failed"
  | "quota_exceeded"
  | "cooldown";

export interface NotificationLog {
  id: number;
  risk_level: string;
  provider: string;
  status: NotificationStatus;
  detail?: string;
  recipient?: string;
  created_at?: string;
}

export interface NotificationLogsResponse {
  sms_enabled: boolean;
  sms_provider: string;
  sms_max_sends: number;
  logs: NotificationLog[];
}

export interface MigraineEpisode {
  id: number;
  start_time: string;
  end_time?: string;
  severity?: string;
  symptoms: string[];
  trigger?: string;
  notes?: string;
}

export interface ReportOverview {
  total_readings: number;
  total_predictions: number;
  total_alerts: number;
  total_episodes: number;
  latest_risk_score?: number;
  latest_risk_level?: RiskLevel;
  average_risk?: number;
  risk_band_counts: Record<string, number>;
  days_monitored: number;
}

export interface DemoSessionStatus {
  running: boolean;
  scenario?: string;
}

export type ScenarioName = "normal" | "moderate" | "high";

export interface DatasetFile {
  name: string;
  size_bytes: number;
  rows: number;
  columns: string[];
  modified: number;
  stored?: boolean;
  storage_bucket?: string;
  storage_key?: string;
}

export interface DatasetsResponse {
  datasets_dir: string;
  files: DatasetFile[];
  thresholds: Record<string, unknown>;
  storage: {
    database?: { url?: string; label?: string; note?: string };
    datasets_dir?: string;
    thresholds_path?: string;
    sms?: {
      provider?: string;
      enabled?: boolean;
      recipient?: string;
      level?: string;
      max_sends?: number;
      sends_used?: number;
    };
    supabase?: Record<string, unknown>;
  };
}

export interface PipelineResult {
  ok: boolean;
  output?: string;
  file?: string;
  config?: Record<string, unknown>;
  log_tail?: string;
}

export interface ThresholdsResponse {
  path: string;
  calibrated: boolean;
  baselines: Record<string, number>;
  band_edges: Record<string, number>;
  deviations: Record<string, unknown>;
  demo_presets: Record<string, Record<string, number>>;
}

export type WsEvent =
  | {
      type: "prediction_update";
      risk_score: number;
      risk_level: string;
      timestamp: string;
      prediction_window_minutes: number;
      features: PredictionFeature[];
      advice?: string[];
    }
  | {
      type: "alert_update";
      id: number;
      risk_score: number;
      risk_level: string;
      message: string;
      timestamp: string;
      acknowledged: boolean;
      prediction_id: number | null;
      advice?: string[];
    };
