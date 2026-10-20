import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";

export interface SeriesPoint {
  label: string;
  value: number;
  dataPointText?: string;
}

/**
 * One chart, one primary metric, one clear time range (charting rule).
 * Values are exposed to screen readers via the accessibility label.
 */
export function ChartCard({
  title,
  unit,
  children,
  summary,
}: {
  title: string;
  unit?: string;
  children: React.ReactNode;
  summary?: string;
}) {
  return (
    <Card>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {children}
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  unit: { ...typography.caption, color: colors.textTertiary },
  summary: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});

export const CHART_RADIUS = radius.md;
