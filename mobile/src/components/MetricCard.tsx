import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";
import { IconCircle } from "./IconCircle";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  iconBackground?: string;
  iconColor?: string;
  sublabelColor?: string;
}

/** Home grid metric tile: icon + label + big value + status line. */
export function MetricCard({
  icon,
  label,
  value,
  sublabel,
  iconBackground = colors.blueTint,
  iconColor = colors.primary,
  sublabelColor = colors.lowDark,
}: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <IconCircle size={32} background={iconBackground} color={iconColor}>
          {icon}
        </IconCircle>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: sublabelColor }]}>{sublabel}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, gap: 6, minHeight: 129 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { ...typography.micro, color: colors.textSecondary },
  value: { ...typography.metric, color: colors.textPrimary, marginTop: 2 },
  sublabel: { ...typography.micro, color: colors.lowDark },
});
