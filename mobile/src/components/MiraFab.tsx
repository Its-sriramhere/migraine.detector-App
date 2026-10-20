import { Pressable, StyleSheet } from "react-native";
import { themeNew } from "../constants/colors";
import { MiraMark } from "./MiraMark";

/**
 * Mira floating assistant button from the Figma "01 Mira" frame: the brand
 * gradient disc with the sparkle, plus a green availability dot.
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
      <MiraMark size={SIZE} withStatus />
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
});
