import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export interface Contribution {
  name: string;
  contribution: number;
  value?: number;
}

/**
 * "Why this risk?" bars. Each feature's signed contribution is drawn as a
 * bar scaled to the largest deviation on the card, so a small factor never
 * looks as important as a large one. Bars that push the score up use the
 * risk colour, bars that pull it down use the low-risk colour.
 */
export function ContributionBars({ items }: { items: Contribution[] }) {
  const peak = Math.max(
    0.0001,
    ...items.map((f) => Math.abs(f.contribution)),
  );

  return (
    <View style={styles.list}>
      {items.map((f, index) => (
        <ContributionBar
          key={f.name}
          name={f.name}
          contribution={f.contribution}
          value={f.value}
          ratio={Math.abs(f.contribution) / peak}
          delay={index * 70}
        />
      ))}
    </View>
  );
}

function ContributionBar({
  name,
  contribution,
  value,
  ratio,
  delay,
}: {
  name: string;
  contribution: number;
  value?: number;
  ratio: number;
  delay: number;
}) {
  const grow = useRef(new Animated.Value(0)).current;
  const positive = contribution >= 0;

  useEffect(() => {
    grow.setValue(0);
    const animation = Animated.timing(grow, {
      toValue: ratio,
      duration: 550,
      delay,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [ratio, delay, grow]);

  const width = grow.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.item}>
      <View style={styles.head}>
        <Text style={styles.name}>{name}</Text>
        <Text
          style={[
            styles.contribution,
            { color: positive ? colors.highText : colors.lowText },
          ]}
        >
          {positive ? "+" : ""}
          {contribution.toFixed(3)}
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: positive ? colors.high : colors.low,
            },
          ]}
        />
      </View>

      {value !== undefined ? (
        <Text style={styles.value}>Measured value {String(value)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  item: { gap: 6 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { ...typography.bodyMedium, fontWeight: "600", color: colors.textPrimary },
  contribution: { ...typography.bodySmall, fontWeight: "700" },
  track: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.bar,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: radius.bar },
  value: { ...typography.micro, color: colors.textTertiary },
});
