import { useId } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** Shared vector mark based on the cached Figma brand reference. */
export function BrandGlyph({ size = 52, assistant = false }: { size?: number; assistant?: boolean }) {
  const id = `brand${useId().replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel={assistant ? "Mira" : "Migraine Detector"}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2D9DEB" />
          <Stop offset="0.5" stopColor="#416BEA" />
          <Stop offset="1" stopColor="#7655DF" />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      {assistant ? (
        <Path d="M32 15 C35 26 38 29 49 32 C38 35 35 38 32 49 C29 38 26 35 15 32 C26 29 29 26 32 15 Z" fill="#FFFFFF" />
      ) : (
        <>
          <Path d="M32 14 C27 10 22 13 20 17 C14 18 12 23 14 28 C9 32 11 39 15 41 C14 47 19 51 24 50 C27 54 31 52 32 50 C36 54 41 52 43 49 C49 49 52 44 50 40 C55 36 53 30 50 27 C52 22 48 17 44 17 C40 12 36 11 32 14 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M32 14 V47 M32 25 C26 22 22 25 21 30 M32 34 C26 34 23 38 23 42 M32 34 C39 34 42 38 42 42 M32 25 C38 22 41 24 43 28" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Circle cx="32" cy="34" r="2.6" fill="#FFFFFF" />
          <Circle cx="23" cy="42" r="2" fill="#FFFFFF" />
          <Circle cx="42" cy="42" r="2" fill="#FFFFFF" />
          <Circle cx="21" cy="30" r="1.7" fill="#FFFFFF" />
        </>
      )}
    </Svg>
  );
}
