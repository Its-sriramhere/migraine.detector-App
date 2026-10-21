import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";
import { Activity, ClipboardList, House, User } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

const ICONS: Record<string, LucideIcon> = {
  Home: House,
  Monitoring: Activity,
  Symptoms: ClipboardList,
  Profile: User,
};

/** Number of tabs rendered before the "+" button takes over a slot. */
const FAB_AFTER = 2;

/**
 * Custom bottom bar: four tabs with a centered "+" action button that opens
 * the wearable (device) connection screen. The button occupies the slot the
 * History tab used to hold, keeping the bar's five-column rhythm.
 */
export function CenteredTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const fab = (
    <View key="fab-slot" style={styles.slot}>
      <Pressable
        testID="device-connection-fab"
        accessibilityRole="button"
        accessibilityLabel="Connect a wearable"
        onPress={() => navigation.navigate("ConnectWearable" as never)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
    </View>
  );

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const focused = state.index === index;
    const Icon = ICONS[route.name];
    const label = descriptors[route.key]?.options?.title ?? route.name;
    const title = typeof label === "string" ? label : route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        testID={`tab-${route.name}`}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={title}
        onPress={onPress}
        style={styles.slot}
      >
        {Icon ? (
          <Icon
            color={focused ? colors.primary : colors.textTertiary}
            size={23}
            strokeWidth={focused ? 2.4 : 1.9}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            { color: focused ? colors.primary : colors.textTertiary },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  };

  const children: ReactNode[] = [];
  state.routes.forEach((route, index) => {
    if (index === FAB_AFTER) children.push(fab);
    children.push(renderTab(route, index));
  });

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: spacing.sm,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingBottom: 2,
    minHeight: 48,
  },
  label: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: "600",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: { transform: [{ scale: 0.9 }], opacity: 0.9 },
  fabPlus: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "300",
  },
});
