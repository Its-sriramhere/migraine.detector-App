import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, HeartPulse, Moon } from "lucide-react-native";
import { ArcGauge } from "../components/ArcGauge";
import { IconCircle } from "../components/IconCircle";
import { LoadingState } from "../components/LoadingState";
import { MiraHost } from "../components/MiraHost";
import { RiskTrendChart } from "../components/RiskTrendChart";
import { SectionHeader } from "../components/SectionHeader";
import { ErrorState } from "../components/States";
import { themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";
import { formatSleep } from "../utils/formatting";
import { navigateToGuideRoute } from "../utils/miraRoutes";

type Props = NativeStackScreenProps<RootStackParamList, "Prediction">;

const SIGNAL_META = [
  {
    key: "sleep",
    title: "Sleep consistency",
    fallback: "Below your usual sleep goal",
    tint: themeNew.purpleTint,
    icon: <Moon size={16} color={themeNew.purple} strokeWidth={2.2} />,
  },
  {
    key: "hrv",
    title: "HRV pattern",
    fallback: "Lower than your baseline",
    tint: themeNew.pinkTint,
    icon: <HeartPulse size={16} color={themeNew.levelHigh} strokeWidth={2.2} />,
  },
  {
    key: "resting",
    title: "Resting signals",
    fallback: "Compare with your usual range",
    tint: themeNew.blueTint,
    icon: <Activity size={16} color={themeNew.primary} strokeWidth={2.2} />,
  },
];

export function PredictionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { prediction, history, loading, error, reload } = useRisk(true);

  const signals = useMemo(() => {
    if (!prediction) return [];
    const features = prediction.features ?? [];
    const read = (name: string) =>
      features.find((f) => f.feature_name.toLowerCase().includes(name));

    const sleep = read("sleep");
    const hrv = read("hrv");
    const rest = read("heart_rate") ?? read("resting");

    return [
      {
        ...SIGNAL_META[0],
        detail:
          sleep?.feature_value !== undefined && sleep?.feature_value !== null
            ? `${Math.round(sleep.feature_value)} h — ${SIGNAL_META[0].fallback.toLowerCase()}`
            : SIGNAL_META[0].fallback,
      },
      {
        ...SIGNAL_META[1],
        detail:
          hrv?.feature_value !== undefined && hrv?.feature_value !== null
            ? `${Math.round(hrv.feature_value)} ms — ${SIGNAL_META[1].fallback.toLowerCase()}`
            : SIGNAL_META[1].fallback,
      },
      {
        ...SIGNAL_META[2],
        detail: rest?.feature_value
          ? `${Math.round(rest.feature_value)} BPM — compare with your usual range`
          : SIGNAL_META[2].fallback,
      },
    ];
  }, [prediction]);

  if (loading && !prediction)
    return <LoadingState message="Loading prediction…" />;
  if (error && !prediction)
    return <ErrorState message={error} onRetry={reload} />;

  const level = prediction?.risk_level ?? "low";
  const score = prediction?.risk_score ?? 0;
  const isDemo = prediction?.source === "demo";

  return (
    <>
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.base },
        ]}
    >
      <SectionHeader
        title="Migraine Prediction"
        subtitle="Personalized early-warning overview"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.card}>
        <Text style={styles.eyebrow}>ESTIMATED RISK • NEXT 24H</Text>
        <ArcGauge
          score={score}
          level={level}
          caption="Illustrative prototype score, not a diagnosis"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Possible risk trend</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>DEMO DATA</Text>
          </View>
        </View>
        <RiskTrendChart predictions={history} />
        {isDemo ? null : (
          <Text style={styles.demoNote}>
            Live wearable signals · {prediction?.model_version ?? "heuristic-v1"}
          </Text>
        )}
      </View>

      <Text style={styles.section}>SIGNALS TO REVIEW</Text>

      {signals.map((s) => (
        <View key={s.key} style={styles.signal}>
          <IconCircle size={30} background={s.tint} color={s.tint}>
            {s.icon}
          </IconCircle>
          <View style={styles.signalText}>
            <Text style={styles.signalTitle}>{s.title}</Text>
            <Text style={styles.signalDetail}>{s.detail}</Text>
          </View>
        </View>
      ))}

      {prediction ? (
        <Text style={styles.footnote}>
          Window {prediction.prediction_window} min · updated{" "}
          {formatSleep(prediction.prediction_window)}
          {" "}
          · research prototype, not a medical device.
        </Text>
      ) : null}
      </ScrollView>

      <MiraHost
        onNavigate={(route) => navigateToGuideRoute(navigation, route, true)}
        bottom={24}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: themeNew.background },
  content: { padding: spacing.base, gap: spacing.md, paddingBottom: 120 },
  title: {
    ...typography.title,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "500",
    color: themeNew.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: themeNew.textSecondary,
    marginTop: -spacing.sm,
  },
  card: {
    backgroundColor: themeNew.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    ...typography.rowTitle,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  eyebrow: {
    ...typography.microStrong,
    fontSize: 12,
    lineHeight: 15,
    color: themeNew.textSecondary,
  },
  chip: {
    backgroundColor: themeNew.demoChipBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: {
    ...typography.microStrong,
    color: themeNew.demoChipText,
    letterSpacing: 0.4,
  },
  demoNote: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  section: {
    ...typography.microStrong,
    fontSize: 12,
    lineHeight: 15,
    color: themeNew.textSecondary,
    marginTop: spacing.sm,
  },
  signal: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: themeNew.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  signalText: { flex: 1, gap: 1 },
  signalTitle: {
    ...typography.bodyMedium,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  signalDetail: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  footnote: {
    ...typography.micro,
    color: themeNew.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
