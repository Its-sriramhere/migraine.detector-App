/**
 * Type scale from the Figma file. Inter throughout.
 * Legacy aliases (h1/h2/h3/body/bodySmall) are kept for older components.
 */
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
  display: make(39, 46, "700"),
  title: make(30, 36, "700"),
  greeting: make(27, 33, "700"),
  screenTitle: make(25, 31, "700"),
  metricBig: make(40, 48, "700"),
  metric: make(21, 27, "700"),
  headerTitle: make(19, 25, "600"),
  section: make(17, 23, "700"),
  rowTitle: make(15, 21, "600"),
  body: make(14, 21, "400"),
  bodyMedium: make(14, 20, "500"),
  bodySmall: make(13, 19, "400"),
  caption: make(12, 18, "400"),
  captionStrong: make(12, 16, "600"),
  micro: make(11, 15, "500"),
  microStrong: make(10, 13, "600"),
  axis: make(9, 12, "500"),
  navLabel: make(10, 13, "600"),

  // legacy aliases
  h1: make(24, 32, "700"),
  h2: make(20, 28, "700"),
  h3: make(17, 24, "600"),
} as const;
