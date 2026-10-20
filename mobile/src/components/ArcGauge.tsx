import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  RISK_BAND_HIGH,
  RISK_BAND_LOW,
  themeNew,
} from "../constants/colors";
import { typography } from "../constants/typography";

/**
 * Semicircular three-band gauge from the Figma "03 Migraine Prediction"
 * screen: green -> amber -> red zones with the score in the middle.
 *
 * The band edges come from the shared risk thresholds (30 / 70) so the gauge
 * can never disagree with the API about what "moderate" means.
 */
const VB_W = 240;
const VB_H = 132;
const CX = 120;
const CY = 120;
const R = 110;
const STROKE = 21;
const CAP_R = STROKE / 2;

/** Point on the gauge circle. The scale runs from 180 (score 0) to 0 (100). */
function point(score: number) {
  const angle = ((180 - score * 1.8) * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(angle),
    y: CY - R * Math.sin(angle),
  };
}

function bandPath(from: number, to: number) {
  const a = point(from);
  const b = point(to);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
}

interface Props {
  score: number;
  level: string;
  caption?: string;
  width?: number;
  /** Use the newer Figma frame palette (default) or the original screens. */
  variant?: "new" | "classic";
}

export function ArcGauge({
  score,
  level,
  caption,
  width = 265,
  variant = "new",
}: Props) {
  const palette =
    variant === "new"
      ? {
          track: themeNew.gaugeTrack,
          low: themeNew.gaugeLow,
          moderate: themeNew.gaugeModerate,
          high: themeNew.gaugeHigh,
          score: themeNew.textPrimary,
          level: themeNew.levelModerate,
        }
      : {
          track: "#EAF0F8",
          low: "#36C58D",
          moderate: "#F4BE56",
          high: "#F16D76",
          score: "#172642",
          level: "#27B985",
        };

  const clamped = Math.max(0, Math.min(100, score));
  const levelColor =
    level === "high"
      ? palette.high
      : level === "moderate"
        ? palette.moderate
        : palette.low;

  // Count the score up from zero so the gauge reads as a live measurement.
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(value));
    Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      useNativeDriver: false,
    }).start();
    return () => progress.removeListener(id);
  }, [clamped, progress]);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const scale = width / VB_W;
  const height = VB_H * scale;

  const bandLow = bandPath(0, RISK_BAND_LOW);
  const bandModerate = bandPath(RISK_BAND_LOW, RISK_BAND_HIGH);
  const bandHigh = bandPath(RISK_BAND_HIGH, 100);

  const endLow = point(0);
  const endHigh = point(100);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Predicted migraine risk ${Math.round(clamped)} percent, ${level}`}
      style={styles.wrap}
    >
      <View style={{ width, height }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
            {/* Track */}
            <Path
              d={bandPath(0, 100)}
              stroke={palette.track}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
            <Circle cx={endLow.x} cy={endLow.y} r={CAP_R} fill={palette.track} />
            <Circle cx={endHigh.x} cy={endHigh.y} r={CAP_R} fill={palette.track} />

            {/* Bands */}
            <Path
              d={bandLow}
              stroke={palette.low}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
            <Circle cx={endLow.x} cy={endLow.y} r={CAP_R} fill={palette.low} />

            <Path
              d={bandModerate}
              stroke={palette.moderate}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />

            <Path
              d={bandHigh}
              stroke={palette.high}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
            <Circle cx={endHigh.x} cy={endHigh.y} r={CAP_R} fill={palette.high} />
          </Svg>
        </Animated.View>

        <View style={styles.readout} pointerEvents="none">
          <Text style={[styles.score, { color: palette.score }]}>
            {Math.round(shown)}
          </Text>
          <Text style={[styles.level, { color: levelColor }]}>
            {level.toUpperCase()}
          </Text>
        </View>
      </View>

      {caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  readout: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 43,
    lineHeight: 52,
    fontWeight: "700",
    marginBottom: 6,
  },
  level: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  caption: {
    ...typography.caption,
    color: themeNew.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});
