import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { AlertsScreen } from "../screens/AlertsScreen";
import { AssessmentScreen } from "../screens/AssessmentScreen";
import { DatasetsScreen } from "../screens/DatasetsScreen";
import { DemoScreen } from "../screens/DemoScreen";
import { ExplanationScreen } from "../screens/ExplanationScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PredictionScreen } from "../screens/PredictionScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { RecommendationsScreen } from "../screens/RecommendationsScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { RiskDetailsScreen } from "../screens/RiskDetailsScreen";
import { SensorDetailsScreen } from "../screens/SensorDetailsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SleepScreen } from "../screens/SleepScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { TrendsScreen } from "../screens/TrendsScreen";
import { WatchScreen } from "../screens/WatchScreen";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState message="Loading…" />;
  return (
    // Keying the container on the session remounts the navigator when the
    // user signs in or out, so the splash always runs and always decides
    // the entry route instead of the stack restoring a stale one.
    <NavigationContainer key={user ? `user-${user.id}` : "signed-out"}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* The splash is the entry point in both branches: it decides
            whether to continue into onboarding, the main tabs or the
            auth stack. */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        {/* Available before sign-in too, so the policy can be read while
            creating an account. */}
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Assessment" component={AssessmentScreen} />
            <Stack.Screen name="RiskDetails" component={RiskDetailsScreen} />
            <Stack.Screen name="Explanation" component={ExplanationScreen} />
            <Stack.Screen
              name="SensorDetails"
              component={SensorDetailsScreen}
            />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="Demo" component={DemoScreen} />
            <Stack.Screen name="Watch" component={WatchScreen} />
            <Stack.Screen
              name="Recommendations"
              component={RecommendationsScreen}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Datasets" component={DatasetsScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Trends" component={TrendsScreen} />
            <Stack.Screen name="Prediction" component={PredictionScreen} />
            <Stack.Screen name="Sleep" component={SleepScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
