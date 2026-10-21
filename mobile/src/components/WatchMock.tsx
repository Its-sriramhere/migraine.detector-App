import { View } from "react-native";
import Svg, { Circle, Path, Rect, Text as SvgText } from "react-native-svg";
import { colors } from "../constants/colors";

interface Props {
  width?: number;
  label?: string;
  showWaveform?: boolean;
}

/**
 * Vector watch mock-up from the Figma design, drawn with react-native-svg
 * so no image assets are required.
 */
export function WatchMock({
  width = 122,
  label = "HEALTH",
  showWaveform = true,
}: Props) {
  const bodyW = width;
  const bodyH = width * 2.09;
  const screenW = bodyW * 0.85;
  const screenH = bodyH * 0.575;
  const radiusScreen = screenW * 0.25;

  return (
    <View style={{ width: bodyW }}>
      <Svg width={bodyW} height={bodyH} viewBox={`0 0 ${bodyW} ${bodyH}`}>
        {/* straps */}
        <Rect
          x={bodyW * 0.22}
          y={0}
          width={bodyW * 0.56}
          height={bodyH * 0.3}
          rx={bodyW * 0.18}
          fill={colors.watchBody}
        />
        <Rect
          x={bodyW * 0.22}
          y={bodyH * 0.72}
          width={bodyW * 0.56}
          height={bodyH * 0.28}
          rx={bodyW * 0.18}
          fill={colors.watchBody}
        />
        {/* body */}
        <Rect
          x={0}
          y={bodyH * 0.14}
          width={bodyW}
          height={bodyH * 0.72}
          rx={bodyW * 0.24}
          fill={colors.watchBody}
        />
        {/* screen */}
        <Rect
          x={(bodyW - screenW) / 2}
          y={bodyH * 0.2}
          width={screenW}
          height={screenH}
          rx={radiusScreen}
          fill={colors.watchScreen}
        />
        <Circle
          cx={bodyW / 2}
          cy={bodyH * 0.2 + screenH * 0.28}
          r={screenW * 0.02}
          fill={colors.watchMuted}
        />
        {showWaveform ? (
          <Path
            d={`M ${bodyW * 0.2} ${bodyH * 0.42} L ${bodyW * 0.36} ${bodyH * 0.42} L ${bodyW * 0.44} ${bodyH * 0.35} L ${bodyW * 0.54} ${bodyH * 0.48} L ${bodyW * 0.63} ${bodyH * 0.4} L ${bodyW * 0.72} ${bodyH * 0.42} L ${bodyW * 0.8} ${bodyH * 0.42}`}
            stroke={colors.splashInk}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        <Path
          d={`M ${bodyW * 0.2} ${bodyH * 0.46} L ${bodyW * 0.8} ${bodyH * 0.46}`}
          stroke={colors.watchMuted}
          strokeWidth={1.5}
          opacity={0.6}
        />
        {label ? (
          <SvgText
            x={bodyW / 2}
            y={bodyH * 0.2 + screenH * 0.85}
            fill={colors.watchMuted}
            fontSize={screenW * 0.11}
            fontWeight="600"
            textAnchor="middle"
            letterSpacing={0.8}
          >
            {label}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}
