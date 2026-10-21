import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { CenteredTabBar } from "../components/CenteredTabBar";
import { MiraHost } from "../components/MiraHost";
import { HomeScreen } from "../screens/HomeScreen";
import { MonitoringScreen } from "../screens/MonitoringScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SymptomsScreen } from "../screens/SymptomsScreen";
import { navigateToGuideRoute } from "../utils/miraRoutes";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const navigation = useNavigation<
    NavigationProp<RootStackParamList & MainTabParamList>
  >();

  const onNavigate = (route: string) => {
    navigateToGuideRoute(navigation, route);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CenteredTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Monitoring" component={MonitoringScreen} />
        <Tab.Screen name="Symptoms" component={SymptomsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      <MiraHost onNavigate={onNavigate} />
    </>
  );
}
