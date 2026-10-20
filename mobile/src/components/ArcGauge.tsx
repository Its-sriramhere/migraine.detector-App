import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { colors, riskColors } from "../constants/colors";
import { typography } from "../constants/typography";

interface Props {
  score: number;
  level: string;
  caption?: string;
  size?: number;
}

/**
 * Semicircular three-band gauge from the Figma risk screen:
 * green → amber → red zones with a marker at the current score.
 */
export function ArcGauge({ score, level, caption, size = 300 }: Props) {
  const rc = riskColors(level);
  const stroke = 26;
  const r = 118;
  const cx = size / 2;
  const cy = size / 2 - 8;

  // 180° arc, 0 = left, 100 = right
  const polar = (percent: number) => {
    const angle = Math.PI * (1 - percent / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    };
  };

  const arcPath = (from: number, to: number) => {
    const start = polar(from);
    const end = polar(to);
    const largeArc = to - from > 50 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const marker = polar(Math.max(0, Math.min(100, score)));
  const inner = polar(Math.max(0, Math.min(100, score)));
  const innerR = r - stroke / 2 - 14;

  return (
    <View style={styles.wrap} accessibilityRole="image"
      accessibilityLabel={`Predicted migraine risk ${Math.round(score)} percent, ${level}`}>
      <Svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        <G>
          <Path
            d={arcPath(0, 50)}
            stroke={colors.low}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={arcPath(50, 78)}
            stroke={colors.moderate}
            strokeWidth={stroke}
            fill="none"
          />
          <Path
            d={arcPath(78, 100)}
            stroke={colors.high}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
          <Circle
            cx={marker.x}
            cy={marker.y}
            r={11}
            fill={colors.surface}
            stroke={rc.indicator}
            strokeWidth={6}
          />
          <Circle
            cx={cx + innerR * (inner.x - cx) / r}
            cy={cy + innerR * (inner.y - cy) / r}
            r={0}
            fill="none"
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.level}>{level.toUpperCase()}</Text>
        <Text style={[styles.score, { color: rc.text }]}>
          {Math.round(score)}%
        </Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
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
  level: { fontSize: 34, lineHeight: 40, fontWeight: "700", color: colors.textPrimary },
  score: { fontSize: 27, lineHeight: 33, fontWeight: "700" },
  caption: { ...typography.caption, color: colors.textSecondary },
});
