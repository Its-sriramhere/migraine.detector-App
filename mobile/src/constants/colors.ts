export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",

  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#64748B",
  disabled: "#94A3B8",

  border: "#E2E8F0",

  low: "#10B981",
  lowBackground: "#ECFDF5",
  lowText: "#047857",

  moderate: "#F59E0B",
  moderateBackground: "#FFFBEB",
  moderateText: "#B45309",

  high: "#EF4444",
  highBackground: "#FEF2F2",
  highText: "#B91C1C",

  error: "#DC2626",
  warning: "#D97706",
  success: "#059669",
} as const;

export type RiskColorKey = "low" | "moderate" | "high";

export function riskColors(level: RiskColorKey | string) {
  switch (level) {
    case "high":
      return {
        indicator: colors.high,
        background: colors.highBackground,
        text: colors.highText,
      };
    case "moderate":
      return {
        indicator: colors.moderate,
        background: colors.moderateBackground,
        text: colors.moderateText,
      };
    default:
      return {
        indicator: colors.low,
        background: colors.lowBackground,
        text: colors.lowText,
      };
  }
}
