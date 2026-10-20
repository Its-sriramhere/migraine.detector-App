import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { SensorReading } from "../types";
import { ChartCard } from "./ChartCard";

type Metric = "heart_rate" | "hrv" | "temperature" | "spo2" | "activity";

const METRIC_META: Record<
  Metric,
  { title: string; unit: string; color: string }
> = {
  heart_rate: { title: "Heart rate", unit: "BPM", color: colors.primary },
  hrv: { title: "HRV", unit: "ms", color: colors.lavenderStrong },
  temperature: { title: "Temperature", unit: "°C", color: colors.moderateDark },
  spo2: { title: "SpO₂", unit: "%", color: colors.lowDark },
  activity: { title: "Motion", unit: "g", color: colors.splashInk },
};

export function MetricChart({
  metric,
  readings,
  limit = 40,
}: {
  metric: Metric;
  readings: SensorReading[];
  limit?: number;
}) {
  const meta = METRIC_META[metric];

  const data = useMemo(() => {
    const points = readings
      .filter((r) => r[metric] !== undefined && r[metric] !== null)
      .slice(-limit)
      .map((r) => ({
        value: Number(r[metric] ?? 0),
        label: "",
      }));
    return points;
  }, [readings, metric, limit]);

  if (data.length < 2) {
    return (
      <ChartCard title={meta.title} unit={meta.unit}>
        <Text style={styles.placeholder}>
          Not enough measurements yet. Start monitoring to build a trend.
        </Text>
      </ChartCard>
    );
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const delta = last - first;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return (
    <ChartCard
      title={meta.title}
      unit={meta.unit}
      summary={`${data.length} readings · latest ${last} ${meta.unit} · trending ${direction}`}
    >
      <View
        accessible
        accessibilityLabel={`${meta.title} trend, ${data.length} readings, latest ${last} ${meta.unit}`}
      >
        <LineChart
          data={data}
          thickness={2.5}
          color={meta.color}
          startFillColor={`${meta.color}33`}
          endFillColor={`${meta.color}05`}
          startOpacity={0.35}
          endOpacity={0.02}
          spacing={Math.max(14, 240 / data.length)}
          width={280}
          height={160}
          initialSpacing={8}
          hideDataPoints={data.length > 25}
          isAnimated
          animationDuration={400}
          curved
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          rulesType="solid"
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
  axis: { ...typography.axis, color: colors.textTertiary },
});
