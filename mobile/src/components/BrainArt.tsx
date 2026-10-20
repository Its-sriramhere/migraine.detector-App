import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../constants/colors";

/**
 * Neural / brain motif from the Figma splash screen and app mark, redrawn
 * as vector primitives so the app ships no raster artwork.
 */
export function BrainArt({
  size = 272,
  color = colors.splashInk,
  accent = colors.splashInkSoft,
  showRings = true,
}: {
  size?: number;
  /** Outline colour. */
  color?: string;
  /** Branches and nodes colour. */
  accent?: string;
  /** Draw the concentric rings behind the brain. */
  showRings?: boolean;
}) {
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 272 272">
        {/* outer rings */}
        {showRings ? (
          <>
            <Circle
              cx={c}
              cy={c}
              r={126}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
              opacity={0.45}
            />
            <Circle
              cx={c}
              cy={c}
              r={102}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
              opacity={0.7}
            />
          </>
        ) : null}
        {/* brain outline */}
        <Path
          d="M136 74c-14-10-34-8-44 4-13 2-22 12-22 25-9 7-12 19-8 30-8 10-8 25 1 34-3 12 2 25 13 30 3 12 15 20 27 19 8 9 22 12 33 6 11 6 25 3 33-6 12 1 24-7 27-19 11-5 16-18 13-30 9-9 9-24 1-34 4-11 1-23-8-30 0-13-9-23-22-25-10-12-30-14-44-4z"
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinejoin="round"
        />
        {/* neural branches */}
        <Path
          d="M136 74v104M136 136c-18 0-30 12-30 28M136 136c18 0 30 12 30 28M136 108c-12-4-22 0-28 10M136 108c12-4 22 0 28 10"
          stroke={accent}
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
        />
        {/* nodes */}
        <Circle cx={136} cy={136} r={7} fill={accent} />
        <Circle cx={106} cy={164} r={6} fill={accent} />
        <Circle cx={166} cy={164} r={6} fill={accent} />
        <Circle cx={108} cy={118} r={4.5} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
