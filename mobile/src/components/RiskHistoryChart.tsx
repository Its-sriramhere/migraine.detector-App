import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { Prediction } from "../types";
import { ChartCard } from "./ChartCard";

export function RiskHistoryChart({
  predictions,
  limit = 40,
}: {
  predictions: Prediction[];
  limit?: number;
}) {
  const points = useMemo(
    () =>
      predictions
        .slice(0, limit)
        .map((p) => ({ value: p.risk_score, label: "" })),
    [predictions, limit],
  );

  if (points.length < 2) {
    return (
      <ChartCard title="Risk trend" unit="%">
        <Text style={styles.placeholder}>
          No risk history yet. Monitoring data will build this trend.
        </Text>
      </ChartCard>
    );
  }

  const latest = points[0].value;
  const oldest = points[points.length - 1].value;
  const delta = latest - oldest;

  return (
    <ChartCard
      title="Risk trend"
      unit="%"
      summary={`${points.length} predictions · latest ${Math.round(latest)}% · ${
        delta >= 0 ? "+" : ""
      }${Math.round(delta)}% over the window`}
    >
      <View
        accessible
        accessibilityLabel={`Risk trend, ${points.length} predictions, latest ${Math.round(latest)} percent`}
      >
        <LineChart
          data={points}
          thickness={2.5}
          color={colors.primary}
          startFillColor={`${colors.primary}33`}
          endFillColor={`${colors.primary}05`}
          startOpacity={0.35}
          endOpacity={0.02}
          spacing={Math.max(14, 240 / points.length)}
          width={280}
          height={160}
          initialSpacing={8}
          hideDataPoints={points.length > 25}
          isAnimated
          animationDuration={400}
          curved
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          noOfSections={4}
          yAxisTextStyle={styles.axis}
          xAxisLabelTextStyle={styles.axis}
          yAxisLabelWidth={32}
        />
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  axis: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
});
