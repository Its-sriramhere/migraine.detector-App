import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "default" | "primary" | "danger";
}

export function Chip({ label, selected, onPress, tone = "default" }: Props) {
  const activeBg =
    tone === "danger"
      ? colors.highBackground
      : tone === "primary"
        ? colors.primaryLight
        : colors.primaryLight;
  const activeBorder =
    tone === "danger" ? colors.high : tone === "primary" ? colors.primary : colors.primary;
  const activeText = tone === "danger" ? colors.highText : colors.primaryDark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: activeBg, borderColor: activeBorder }]}
    >
      <Text style={[styles.text, selected && { color: activeText, fontWeight: "600" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  text: { ...typography.bodySmall, color: colors.textSecondary },
});
