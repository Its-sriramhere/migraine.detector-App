import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { IconCircle } from "./IconCircle";

interface Props {
  icon?: ReactNode;
  title: string;
  body?: string;
  background?: string;
  iconBackground?: string;
  iconColor?: string;
  titleColor?: string;
  bodyColor?: string;
}

/** Tinted full-width card used for reassuring status messages. */
export function StatusCard({
  icon,
  title,
  body,
  background = colors.lowPale,
  iconBackground = colors.lowBackground,
  iconColor = colors.low,
  titleColor = colors.textPrimary,
  bodyColor = colors.textSecondary,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: background }]}>
      {icon ? (
        <IconCircle size={40} background={iconBackground} color={iconColor}>
          {icon}
        </IconCircle>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {body ? (
          <Text style={[styles.body, { color: bodyColor }]}>{body}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.card,
    padding: spacing.base,
  },
  text: { flex: 1, gap: 1 },
  title: { ...typography.bodyMedium, fontWeight: "600" },
  body: { ...typography.micro, fontSize: 12 },
});
