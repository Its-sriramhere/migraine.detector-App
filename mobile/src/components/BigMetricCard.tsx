import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";
import { IconCircle } from "./IconCircle";
import { StatusPill } from "./StatusPill";

interface Props {
  icon: ReactNode;
  title: string;
  value: string;
  statusLabel?: string;
  statusText?: string;
  statusBackground?: string;
  goal?: string;
  children?: ReactNode;
}

/** Headline metric card from the Figma Health Metrics screen. */
export function BigMetricCard({
  icon,
  title,
  value,
  statusLabel,
  statusText,
  statusBackground,
  goal,
  children,
}: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconCircle size={56} background={colors.lavender} color={colors.lavenderStrong}>
          {icon}
        </IconCircle>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        {statusLabel && statusText && statusBackground ? (
          <StatusPill
            label={statusLabel}
            text={statusText}
            background={statusBackground}
          />
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {goal ? <Text style={styles.goal}>{goal}</Text> : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, gap: 2 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  spacer: { flex: 1 },
  title: { ...typography.section, color: colors.textPrimary },
  value: { ...typography.metricBig, color: colors.textPrimary, marginTop: spacing.md },
  goal: { ...typography.bodySmall, color: colors.textSecondary },
});
