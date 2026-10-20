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
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: Props) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.dim,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : colors.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textP : styles.textS]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: "transparent" },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  dim: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  text: { ...typography.bodyMedium, fontWeight: "600" },
  textP: { color: "#FFFFFF" },
  textS: { color: colors.primary },
});
