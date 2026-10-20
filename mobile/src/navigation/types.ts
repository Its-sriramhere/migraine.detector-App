export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Monitoring: undefined;
  History: undefined;
  Symptoms: undefined;
  Profile: undefined;
};

export type SensorMetric =
  | "heart_rate"
  | "hrv"
  | "temperature"
  | "spo2"
  | "activity";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Assessment: undefined;
  RiskDetails: { predictionId?: number };
  Explanation: { predictionId: number };
  SensorDetails: { metric: SensorMetric };
  Alerts: undefined;
  Demo: undefined;
  Device: undefined;
  Settings: undefined;
  Reports: undefined;
  Datasets: undefined;
};
