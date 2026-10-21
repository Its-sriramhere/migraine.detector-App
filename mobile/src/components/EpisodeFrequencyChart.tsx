import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { themeNew } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export interface EpisodeDay {
  label: string;
  count: number;
}

const PLOT_HEIGHT = 68;
const BAR_WIDTH = 21;
const MAX_BAR = 65;

/**
 * "Episode frequency" bars from the Figma "02 Migraine History" screen.
 * Every bar uses the soft blue fill; the busiest day is highlighted in
 * violet. Bars grow from the baseline when the data changes.
 */
export function EpisodeFrequencyChart({ days }: { days: EpisodeDay[] }) {
  const peak = Math.max(1, ...days.map((d) => d.count));
  const [grow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [days, grow]);

  if (days.length === 0 || days.every((day) => day.count === 0)) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          No episodes logged in this period yet.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.plot}>
        {days.map((d) => {
          const ratio = d.count / peak;
          const target = d.count > 0 ? Math.max(8, ratio * MAX_BAR) : 0;
          const isPeak = d.count === peak && d.count > 0;
          return (
            <View key={d.label} style={styles.column}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: grow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, target],
                    }),
                    backgroundColor: isPeak
                      ? themeNew.chartBarActive
                      : themeNew.chartBar,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {days.map((d) => (
          <Text key={d.label} style={styles.label}>
            {d.label}
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
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: BAR_WIDTH, borderRadius: 7 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  label: {
    ...typography.axis,
    color: themeNew.textSecondary,
  },
});
