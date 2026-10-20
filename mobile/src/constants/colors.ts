/**
 * Design tokens extracted from the Figma file
 * "Migraine Detector — Mobile App UI (10 Screens)".
 */
export const colors = {
  // Brand
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  accent: "#3B82F6",
  accentSoft: "#93C5FD",
  accentPale: "#EFF6FF",

  // Surfaces
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",
  surfaceSunken: "#F8FAFC",
  border: "#E4E7F0",
  borderStrong: "#D6DBE8",

  // Text
  textPrimary: "#111A3A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textInverse: "#FFFFFF",
  disabled: "#CBD5E1",

  // Risk levels
  low: "#10B981",
  lowDark: "#059669",
  lowBackground: "#D1FAE5",
  lowPale: "#ECFDF5",

  moderate: "#F59E0B",
  moderateDark: "#B45309",
  moderateBackground: "#FEF3C7",
  moderatePale: "#FFFBEB",

  high: "#EF4444",
  highDark: "#DC2626",
  highBackground: "#FECACA",
  highPale: "#FEF2F2",

  // Accent tints
  lavender: "#EDE9FE",
  lavenderStrong: "#8B5CF6",
  blueTint: "#DBEAFE",
  mintTint: "#D1FAE5",
  pinkTint: "#FCE7E7",
  creamTint: "#FEF3C7",

  // Watch hardware
  watchBody: "#0B1220",
  watchScreen: "#1E293B",
  watchText: "#E2E8F0",
  watchMuted: "#94A3B8",

  // Splash
  splashTop: "#0A2540",
  splashBottom: "#13315C",
  splashShape: "#0B1E3A",
  splashInk: "#4DA3FF",
  splashInkSoft: "#38BDF8",

  error: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",

  // legacy aliases
  lowText: "#047857",
  moderateText: "#B45309",
  highText: "#B91C1C",
} as const;

export type RiskColorKey = "low" | "moderate" | "high";

export function riskColors(level: RiskColorKey | string) {
  switch (level) {
    case "high":
      return {
        indicator: colors.high,
        text: colors.highDark,
        background: colors.highPale,
        solid: colors.highBackground,
      };
    case "moderate":
      return {
        indicator: colors.moderate,
        text: colors.moderateDark,
        background: colors.moderatePale,
        solid: colors.moderateBackground,
      };
    default:
      return {
        indicator: colors.low,
        text: colors.lowDark,
        background: colors.lowPale,
        solid: colors.lowBackground,
      };
  }
}

/** Human label used in risk copy ("LOW RISK"). */
export function riskHeadline(level: RiskColorKey | string): string {
  switch (level) {
    case "high":
      return "HIGH RISK";
    case "moderate":
      return "MODERATE RISK";
    default:
      return "LOW RISK";
  }
}
