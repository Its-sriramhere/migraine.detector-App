import { Sparkle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { themeNew } from "../constants/colors";

/**
 * Mira floating assistant button from the Figma "01 Mira" frame: a blue
 * disc with a lighter halo, a white sparkle and a green availability dot.
 *
 * It deliberately overlaps the content above the bottom navigation, the way
 * the Figma frame shows it.
 */
const SIZE = 58;
const HALO = 42;
const DOT = 11;

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
      <View style={styles.halo}>
        <Sparkle size={26} color="#FFFFFF" strokeWidth={1.6} />
      </View>
      <View style={styles.dot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: themeNew.miraPrimary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#246BE8",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { transform: [{ scale: 0.92 }], opacity: 0.92 },
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: themeNew.miraHalo,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: themeNew.miraAvailable,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});

/** A text-only variant of the sparkle, used where an icon cannot be placed. */
export function MiraSparkle({ size = 18 }: { size?: number }) {
  return <Text style={{ fontSize: size }}>✦</Text>;
}
