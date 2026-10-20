import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { themeNew } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { Prediction } from "../types";

/**
 * "Possible risk trend" chart from the Figma "03 Migraine Prediction"
 * screen: a violet line over two faint rules with a now / +2h ... +12h axis.
 *
 * The forecast window is derived from the prediction's own window so the
 * chart always describes the same horizon the API reported.
 */
const HORIZON_LABELS = ["Now", "+2h", "+4h", "+6h", "+8h", "+12h"];

export function RiskTrendChart({
  predictions,
  limit = 6,
}: {
  predictions: Prediction[];
  limit?: number;
}) {
  const points = useMemo(() => {
    const history = predictions
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp ?? 0).getTime() -
          new Date(b.timestamp ?? 0).getTime(),
      )
      .slice(-limit);
    return history.map((p) => ({ value: Math.round(p.risk_score) }));
  }, [predictions, limit]);

  if (points.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Not enough predictions yet to draw a risk trend.
        </Text>
      </View>
    );
  }

  const labels = HORIZON_LABELS.slice(
    0,
    Math.max(2, Math.min(HORIZON_LABELS.length, points.length)),
  );

  // Scale the axis around the data so the line sits in the middle of the
  // plot and its shape stays readable, the way the Figma frame shows it.
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 1);
  const yAxisOffset = Math.round(lo - span * 0.5);
  const maxValue = Math.round(hi + span * 0.5);

  return (
    <View>
      <View
        accessible
        accessibilityLabel={`Possible risk trend across ${points.length} points, latest ${points[points.length - 1].value} percent`}
      >
        <LineChart
          data={points}
          thickness={3}
          color={themeNew.chartLine}
          startFillColor={`${themeNew.chartLine}4D`}
          endFillColor={`${themeNew.chartLine}1A`}
          startOpacity={0.45}
          endOpacity={0.12}
          curved
          isAnimated
          animationDuration={600}
          width={300}
          height={76}
          initialSpacing={10}
          spacing={Math.max(16, 280 / points.length)}
          hideDataPoints
          adjustToWidth
          yAxisOffset={yAxisOffset}
          maxValue={maxValue}
          yAxisThickness={0}
          xAxisThickness={0}
          noOfSections={2}
          rulesColor={themeNew.chartRules}
          rulesType="solid"
          yAxisColor={themeNew.chartRules}
          xAxisColor={themeNew.chartRules}
          hideYAxisText
          hideRules={false}
        />
      </View>

      <View style={styles.axis}>
        {labels.map((label) => (
          <Text key={label} style={styles.axisLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { paddingVertical: spacing.lg },
  placeholderText: {
    ...typography.bodySmall,
    color: themeNew.textSecondary,
  },
  hidden: { opacity: 0 },
  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  axisLabel: {
    ...typography.axis,
    color: themeNew.textSecondary,
  },
});
