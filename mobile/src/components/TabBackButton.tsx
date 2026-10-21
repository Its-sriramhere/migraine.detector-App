import { Pressable, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../constants/colors";

/**
 * Back chevron for the bottom-tab screens. The tabs sit at the root of the
 * stack, so it returns to Home rather than popping history.
 */
export function TabBackButton({
  onPress,
  label = "Back to Home",
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      hitSlop={10}
    >
      <ChevronLeft color={colors.textPrimary} size={26} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 40,
    height: 44,
    justifyContent: "center",
    marginLeft: -6,
  },
  pressed: { opacity: 0.6 },
});
