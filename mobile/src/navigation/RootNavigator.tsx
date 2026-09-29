import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../components/LoadingState";
import { AssessmentScreen } from "../screens/AssessmentScreen";
import { ExplanationScreen } from "../screens/ExplanationScreen";
import { RiskDetailsScreen } from "../screens/RiskDetailsScreen";
import { SensorDetailsScreen } from "../screens/SensorDetailsScreen";
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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
