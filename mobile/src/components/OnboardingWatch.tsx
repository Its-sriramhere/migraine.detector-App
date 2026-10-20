import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

/**
 * Onboarding watch from the Figma "02 Onboarding" screen: a navy case with
 * a lit face showing the time, a cyan pulse trace and the HEALTH MONITOR
 * caption, drawn as vectors so the app ships no raster artwork.
 */
const W = 159;
const H = 327;

export function OnboardingWatch({ width = 159 }: { width?: number }) {
  const height = (width / W) * H;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      {/* Strap */}
      <Rect x={35} y={0} width={91} height={327} rx={30} fill="#1D2734" />
      <Rect x={44} y={18} width={73} height={290} rx={22} fill="#293746" />

      {/* Case and face */}
      <Rect x={0} y={56} width={159} height={202} rx={35} fill="#101923" />
      <Rect x={12} y={70} width={135} height={174} rx={27} fill="#1C3455" />

      <SvgText
        x={79.5}
        y={112}
        fill="#FFFFFF"
        fontSize={28}
        fontWeight="600"
        textAnchor="middle"
      >
        10:09
      </SvgText>

      <Path
        d="M22 178 L50 178 L60 160 L72 196 L86 140 L100 180 L110 168 L136 168"
        stroke="#60D8FF"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <SvgText
        x={79.5}
        y={221}
        fill="#C9DCF3"
        fontSize={10}
        fontWeight="600"
        letterSpacing={0.8}
        textAnchor="middle"
      >
        HEALTH MONITOR
      </SvgText>
    </Svg>
  );
}
