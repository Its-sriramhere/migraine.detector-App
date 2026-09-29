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

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Assessment: undefined;
  RiskDetails: { predictionId?: number };
  Explanation: { predictionId: number };
  SensorDetails: { name: string };
};
