import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Activity, ClipboardList, House, User } from "lucide-react-native";
import { CenteredTabBar } from "../components/CenteredTabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { MonitoringScreen } from "../screens/MonitoringScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SymptomsScreen } from "../screens/SymptomsScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS = {
  Home: House,
  Monitoring: Activity,
  Symptoms: ClipboardList,
  Profile: User,
} as const;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CenteredTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="Symptoms" component={SymptomsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
