import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Activity, ClipboardList, History, House, User } from "lucide-react-native";
import { colors } from "../constants/colors";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MonitoringScreen } from "../screens/MonitoringScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SymptomsScreen } from "../screens/SymptomsScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS = {
  Home: House,
  Monitoring: Activity,
  History: History,
  Symptoms: ClipboardList,
  Profile: User,
} as const;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 74,
          paddingTop: 10,
          paddingBottom: 14,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarIcon: ({ color, focused }) => {
          const Icon = ICONS[route.name];
          return <Icon color={color} size={23} strokeWidth={focused ? 2.4 : 1.9} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Symptoms" component={SymptomsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
