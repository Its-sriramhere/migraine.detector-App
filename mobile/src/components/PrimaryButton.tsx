import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: Props) {
  const tone = {
    primary: { bg: colors.primary, fg: "#FFFFFF", border: "transparent" },
    secondary: {
      bg: colors.surface,
      fg: colors.primary,
      border: colors.borderStrong,
    },
    danger: { bg: colors.highPale, fg: colors.high, border: "transparent" },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tone.bg, borderColor: tone.border },
        (disabled || loading) && styles.dim,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <Text style={[styles.text, { color: tone.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  text: { ...typography.bodyMedium, fontWeight: "600" },
  dim: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
