/**
 * Design tokens extracted from the Figma file
 * "Migraine Detector — Mobile App UI (10 Screens)".
 *
 * The file contains two related palettes:
 *   - the ten original screens  -> `colors` (global tokens)
 *   - the newer Mira / History / Prediction frames -> `themeNew`
 *
 * Both agree on the brand navy (#172642) and the primary blue (#246BE8); the
 * gauge band colours and the secondary text differ slightly, so the newer
 * frames keep their own set.
 */
export const colors = {
  // Brand
  primary: "#246BE8",
  primaryDark: "#1D5FD1",
  primaryLight: "#EAF2FF",
  accent: "#27B985",
  accentSoft: "#D8E8FF",
  accentPale: "#E2F8ED",

  // Surfaces
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F6F9FE",
  surfaceSunken: "#F8FAFC",
  border: "#E6EDF8",
  borderStrong: "#E5EDF8",

  // Text
  textPrimary: "#172642",
  textSecondary: "#6D7F9C",
  textTertiary: "#94A3B8",
  textInverse: "#FFFFFF",
  disabled: "#CBD5E1",

  // Risk levels
  low: "#36C58D",
  lowDark: "#27B985",
  lowBackground: "#C5F0DB",
  lowPale: "#E2F8ED",

  moderate: "#F4BE56",
  moderateDark: "#B45309",
  moderateBackground: "#FCE3B4",
  moderatePale: "#FEF6E7",

  high: "#F16D76",
  highDark: "#C9404C",
  highBackground: "#FBD9DC",
  highPale: "#FEF1F2",

  // Accent tints
  lavender: "#F1EDFF",
  lavenderStrong: "#8466F0",
  blueTint: "#EAF2FF",
  mintTint: "#E2F8ED",
  pinkTint: "#FFF0F0",
  creamTint: "#FEF3C7",

  // Watch hardware
  watchBody: "#0B1220",
  watchScreen: "#1E293B",
  watchText: "#E2E8F0",
  watchMuted: "#94A3B8",

  // Splash
  splashTop: "#0C2449",
  splashBottom: "#102F5D",
  splashShape: "#11345B",
  splashInk: "#35AAFF",
  splashInkSoft: "#84E9FF",

  error: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",

  // legacy aliases
  lowText: "#27B985",
  moderateText: "#B45309",
  highText: "#C9404C",
} as const;

/**
 * Palette for the newer Figma frames — "01 Mira", "02 Migraine History" and
 * "03 Migraine Prediction". Slightly warmer greys and a softer gauge ramp
 * than the ten original screens.
 */
export const themeNew = {
  background: "#F8FBFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F2F6FF",
  border: "#E4ECF7",

  textPrimary: "#172642",
  textSecondary: "#7182A0",
  textTertiary: "#99AAC3",

  primary: "#246BE8",
  primaryDark: "#1D5FD1",
  primaryLight: "#EAF2FF",

  // Gauge bands
  gaugeTrack: "#EEF2FB",
  gaugeLow: "#40BD9D",
  gaugeModerate: "#FFC46E",
  gaugeHigh: "#F08086",
  levelLow: "#22AC7B",
  levelModerate: "#F4AC52",
  levelHigh: "#E76570",

  // Signal tints
  purple: "#8069EA",
  purpleText: "#745BDF",
  purpleTint: "#F0EDFF",
  blueTint: "#EAF2FF",
  mintTint: "#E8F8F1",
  pinkTint: "#FFF0F1",

  // Charts
  chartBar: "#B8C9FF",
  chartBarActive: "#8069EA",
  chartLine: "#8069EA",
  chartRules: "#E8EFFA",

  // Chips
  demoChipBackground: "#FFF0E5",
  demoChipText: "#C78531",

  // Mira assistant
  miraPrimary: "#246BE8",
  miraHalo: "#5B8DFF",
  miraAvatar: "#77A1FF",
  miraOnline: "#70E2BA",
  miraAvailable: "#4BD1A8",
  miraBubble: "#F2F6FF",
  miraBubbleAlt: "#F3F7FF",
  miraUserBubble: "#256BEA",
  miraDim: "#13274B",
  miraComposerStroke: "#E5EDF8",
  miraPresence: "#DDEAFF",
  miraDate: "#6D7F9C",
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

/**
 * Band edges of the risk score. These mirror the backend thresholds
 * (backend/app/ml/thresholds.json -> band_edges low 30, high 70) so the
 * gauge, the badges and the API never disagree about what "moderate" means.
 */
export const RISK_BAND_LOW = 30;
export const RISK_BAND_HIGH = 70;
