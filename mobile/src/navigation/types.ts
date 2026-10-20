export type AuthStackParamList = {
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
  Splash: undefined;
  Auth: undefined;
  Main: { screen?: keyof MainTabParamList } | undefined;
  Onboarding: undefined;
  Assessment: undefined;
  RiskDetails: { predictionId?: number };
  Explanation: { predictionId: number };
  SensorDetails: { metric: SensorMetric };
  Alerts: undefined;
  Demo: undefined;
  Watch: undefined;
  Recommendations: undefined;
  Settings: undefined;
  Reports: undefined;
  Datasets: undefined;
  History: undefined;
  Trends: undefined;
  Prediction: undefined;
  Sleep: undefined;
  PrivacyPolicy: undefined;
};
