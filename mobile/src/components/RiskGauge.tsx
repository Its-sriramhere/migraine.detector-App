import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, riskColors } from "../constants/colors";
import { typography } from "../constants/typography";

interface Props {
  score: number;
  level: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const RADIUS = 85;

/**
 * Ring gauge for the predicted risk score.
 * Colour is never the only signal — the numeric score and the level text
 * are always rendered (accessibility rule).
 */
export function RiskGauge({
  score,
  level,
  size = 200,
  strokeWidth = 14,
  label,
}: Props) {
  const rc = riskColors(level);
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * RADIUS;
  const progress = (clamped / 100) * circumference;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Predicted migraine risk ${Math.round(clamped)} percent, ${level}`}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle
          cx={100}
          cy={100}
          r={RADIUS}
          stroke={colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={100}
          cy={100}
          r={RADIUS}
          stroke={rc.indicator}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 100 100)"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.score, { color: rc.text }]}>
          {Math.round(clamped)}%
        </Text>
        <Text style={[styles.level, { color: rc.text }]}>
          {level.toUpperCase()}
        </Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  score: { fontSize: 40, fontWeight: "700" },
  level: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  label: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
});
