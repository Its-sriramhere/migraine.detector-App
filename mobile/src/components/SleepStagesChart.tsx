import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { themeNew } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { SleepNight } from "../services/ble/watchProtocol";

export interface SleepStage {
  key: "awake" | "rem" | "light" | "deep";
  label: string;
  minutes: number;
  color: string;
}

/** Awake sits on top of the bar, then REM, light and deep sleep. */
export const STAGE_COLORS: Record<SleepStage["key"], string> = {
  awake: "#D8E8FF",
  rem: "#5B8DFF",
  light: themeNew.primary,
  deep: themeNew.purple,
};

const PLOT_HEIGHT = 110;
const BAR_WIDTH = 22;

export function stagesOf(night: SleepNight): SleepStage[] {
  return [
    { key: "awake", label: "Awake", minutes: night.awakeMinutes, color: STAGE_COLORS.awake },
    { key: "rem", label: "REM", minutes: night.remMinutes, color: STAGE_COLORS.rem },
    { key: "light", label: "Light", minutes: night.lightMinutes, color: STAGE_COLORS.light },
    { key: "deep", label: "Deep", minutes: night.deepMinutes, color: STAGE_COLORS.deep },
  ];
}

/**
 * Stacked sleep-stage bars from the Figma sleep concept: one column per
 * night, segmented into Awake, REM, Light and Deep.
 */
export function SleepStagesChart({ nights }: { nights: SleepNight[] }) {
  const [grow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [nights, grow]);

  if (nights.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          No sleep data yet. Connect your wearable to see your nights.
        </Text>
      </View>
    );
  }

  const peak = Math.max(
    1,
    ...nights.map((n) =>
      n.awakeMinutes + n.remMinutes + n.lightMinutes + n.deepMinutes,
    ),
  );

  return (
    <View>
      <View style={styles.plot}>
        {nights.map((night) => {
          const stages = stagesOf(night);
          const total = stages.reduce((sum, s) => sum + s.minutes, 0);
          return (
            <View key={night.date} style={styles.column}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: grow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (total / peak) * PLOT_HEIGHT],
                    }),
                  },
                ]}
              >
                {stages.map((stage) => (
                  <View
                    key={stage.key}
                    style={{
                      flex: stage.minutes,
                      backgroundColor: stage.color,
                    }}
                  />
                ))}
              </Animated.View>
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {nights.map((night) => (
          <Text key={night.date} style={styles.label}>
            {new Date(night.date).toLocaleDateString(undefined, {
              weekday: "narrow",
            })}
          </Text>
        ))}
      </View>

      <View style={styles.legend}>
        {(["awake", "rem", "light", "deep"] as const).map((key) => (
          <View key={key} style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, { backgroundColor: STAGE_COLORS[key] }]}
            />
            <Text style={styles.legendText}>
              {key === "awake"
                ? "Awake"
                : key === "rem"
                  ? "REM"
                  : key === "light"
                    ? "Light"
                    : "Deep"}
            </Text>
          </View>
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
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 7,
    overflow: "hidden",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  label: {
    ...typography.axis,
    color: themeNew.textSecondary,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
});
