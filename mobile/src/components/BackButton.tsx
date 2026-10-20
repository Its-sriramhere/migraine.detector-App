import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

/**
 * Standalone back chevron for screens that keep their own title layout but
 * still need a way out.
 */
export function BackButton({
  onPress,
  label = "Go back",
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
