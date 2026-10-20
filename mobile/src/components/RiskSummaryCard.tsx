import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, riskColors, riskHeadline } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";
import { IconCircle } from "./IconCircle";
import { StatusPill } from "./StatusPill";

interface Props {
  icon: ReactNode;
  level: string;
  sentence: string;
}

/**
 * Home risk card: status icon, title, level pill and a plain-language
 * summary of the predicted risk.
 */
export function RiskSummaryCard({ icon, level, sentence }: Props) {
  const rc = riskColors(level);
  return (
    <Card style={styles.card}>
      <IconCircle
        size={46}
        background={rc.solid}
        color={rc.indicator}
      >
        {icon}
      </IconCircle>
      <View style={styles.text}>
        <Text style={styles.title}>Migraine Risk</Text>
        <StatusPill
          label={riskHeadline(level)}
          text={rc.text}
          background={rc.solid}
        />
        <Text style={styles.sentence}>{sentence}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.risk,
    paddingVertical: spacing.lg,
  },
  text: { flex: 1, gap: 6 },
  title: { ...typography.bodyMedium, fontWeight: "600", color: colors.textPrimary },
  sentence: { ...typography.caption, color: colors.textSecondary },
});
