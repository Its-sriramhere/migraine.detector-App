import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { AlertsScreen } from "../screens/AlertsScreen";
import { AssessmentScreen } from "../screens/AssessmentScreen";
import { DatasetsScreen } from "../screens/DatasetsScreen";
import { DemoScreen } from "../screens/DemoScreen";
import { DeviceScreen } from "../screens/DeviceScreen";
import { ExplanationScreen } from "../screens/ExplanationScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { RiskDetailsScreen } from "../screens/RiskDetailsScreen";
import { SensorDetailsScreen } from "../screens/SensorDetailsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState message="Loading…" />;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Assessment" component={AssessmentScreen} />
            <Stack.Screen name="RiskDetails" component={RiskDetailsScreen} />
            <Stack.Screen name="Explanation" component={ExplanationScreen} />
            <Stack.Screen
              name="SensorDetails"
              component={SensorDetailsScreen}
            />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="Demo" component={DemoScreen} />
            <Stack.Screen name="Device" component={DeviceScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Datasets" component={DatasetsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
