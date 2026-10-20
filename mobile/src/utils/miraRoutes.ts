import type { NavigationProp } from "@react-navigation/native";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

/**
 * Any navigation object that can move between the app's screens. The real
 * type differs between the tab navigator and the root stack, so the helper
 * works against this structural shape instead.
 */
export interface GuideNavigation {
  navigate: unknown;
}

/** Guide route -> bottom tab. */
const TAB_ROUTES: Record<string, keyof MainTabParamList> = {
  home: "Home",
  monitoring: "Monitoring",
  profile: "Profile",
};

/** Guide route -> root stack screen. */
const STACK_ROUTES: Record<string, keyof RootStackParamList> = {
  prediction: "Prediction",
  sleep: "Sleep",
  trends: "Trends",
  history: "History",
  alerts: "Alerts",
  recommendations: "Recommendations",
  watch: "Watch",
};

/**
 * Send the user to the screen the assistant asked for.
 *
 * `viaMain` is needed when the caller sits on a root stack screen: the tab
 * routes then have to be reached through the Main tabs screen.
 */
export function navigateToGuideRoute(
  navigation: GuideNavigation,
  route: string,
  viaMain = false,
): void {
  const nav = navigation as unknown as NavigationProp<
    RootStackParamList & MainTabParamList
  >;

  const tab = TAB_ROUTES[route];
  if (tab) {
    if (viaMain) {
      nav.navigate("Main", { screen: tab } as never);
    } else {
      nav.navigate(tab as never);
    }
    return;
  }

  const stack = STACK_ROUTES[route];
  if (stack) {
    nav.navigate(stack as never);
  }
}
