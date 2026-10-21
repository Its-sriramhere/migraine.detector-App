import { Pressable, StyleSheet, View } from "react-native";
import { themeNew } from "../constants/colors";
import { AppLogo } from "./AppLogo";

/**
 * Mira floating button uses the same neural brand mark as the splash screen,
 * with a green availability dot.
 *
 * It deliberately overlaps the content above the bottom navigation, the way
 * the Figma frame shows it.
 */
const SIZE = 58;

export function MiraFab({
  onPress,
  bottom = 92,
  right = 16,
}: {
  onPress: () => void;
  /** Distance from the bottom of the screen. */
  bottom?: number;
  right?: number;
}) {
  return (
    <Pressable
      testID="mira-fab"
      accessibilityRole="button"
      accessibilityLabel="Open Mira assistant"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom, right },
        pressed && styles.pressed,
      ]}
    >
      <AppLogo size={SIZE} />
      <View pointerEvents="none" style={styles.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: themeNew.miraPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { transform: [{ scale: 0.92 }], opacity: 0.92 },
  status: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: themeNew.miraAvailable,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
