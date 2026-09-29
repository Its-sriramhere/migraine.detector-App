import { TextStyle } from "react-native";

type Weight = TextStyle["fontWeight"];

function make(
  fontSize: number,
  lineHeight: number,
  fontWeight: Weight,
): TextStyle {
  return { fontSize, lineHeight, fontWeight };
}

export const typography = {
  display: make(32, 40, "700"),
  h1: make(24, 32, "700"),
  h2: make(20, 28, "700"),
  h3: make(17, 24, "600"),
  body: make(16, 24, "400"),
  bodySmall: make(14, 20, "400"),
  caption: make(12, 16, "500"),
  numeric: make(28, 34, "700"),
} as const;
