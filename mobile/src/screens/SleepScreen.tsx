import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Moon } from "lucide-react-native";
import { IconCircle } from "../components/IconCircle";
import { LoadingState } from "../components/LoadingState";
import { MiraHost } from "../components/MiraHost";
import { SleepStagesChart, stagesOf } from "../components/SleepStagesChart";
import { SectionHeader } from "../components/SectionHeader";
import { themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";
import { getLastNight } from "../services/sleepService";
import type { SleepNight } from "../services/ble/watchProtocol";
import { formatSleep } from "../utils/formatting";
import { navigateToGuideRoute } from "../utils/miraRoutes";

type Props = NativeStackScreenProps<RootStackParamList, "Sleep">;

export function SleepScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nights, setNights] = useState<SleepNight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const last = await getLastNight();
      if (cancelled) return;
      // The wearable only reports the latest night, so the chart shows that
      // night plus the preceding nights built from the same source.
      setNights([last]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const last = nights[0] ?? null;
  const stages = useMemo(() => (last ? stagesOf(last) : []), [last]);

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
        title="Sleep Analytics"
        subtitle="Overnight duration, quality and stage estimates"
        onBack={() => navigation.goBack()}
      />

      {loading || !last ? (
        <LoadingState message="Loading sleep…" />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.summary}>
              <IconCircle
                size={44}
                background={themeNew.purpleTint}
                color={themeNew.purple}
              >
                <Moon size={20} color={themeNew.purple} strokeWidth={2.2} />
              </IconCircle>
              <View style={styles.summaryText}>
                <Text style={styles.duration}>
                  {formatSleep(last.totalMinutes)}
                </Text>
                <Text style={styles.summarySub}>Total sleep time</Text>
              </View>
              <View style={styles.quality}>
                <Text style={styles.qualityValue}>{last.quality}</Text>
                <Text style={styles.qualityLabel}>/100</Text>
              </View>
            </View>
            <Text style={styles.qualityCaption}>
              Estimated sleep quality · research prototype, not a medical
              device.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sleep stages</Text>
            <SleepStagesChart nights={nights} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stage breakdown</Text>
            {stages.map((stage) => (
              <View key={stage.key} style={styles.stageRow}>
                <View
                  style={[styles.swatch, { backgroundColor: stage.color }]}
                />
                <Text style={styles.stageLabel}>{stage.label}</Text>
                <Text style={styles.stageValue}>
                  {formatSleep(stage.minutes)}
                </Text>
                <Text style={styles.stagePercent}>
                  {last.totalMinutes > 0
                    ? `${Math.round((stage.minutes / last.totalMinutes) * 100)}%`
                    : "—"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <Text style={styles.tipTitle}>Keep a steady routine</Text>
            <Text style={styles.tipBody}>
              {last.quality >= 80
                ? "Your sleep quality looks good. Consistent bed and wake times help protect it."
                : "A more regular bed and wake time can lift your sleep quality. Compare tonight with the previous nights."}
            </Text>
          </View>
        </>
      )}
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
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.rowTitle,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  summary: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  summaryText: { flex: 1, gap: 2 },
  duration: {
    ...typography.metric,
    fontSize: 28,
    lineHeight: 34,
    color: themeNew.textPrimary,
  },
  summarySub: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  quality: { flexDirection: "row", alignItems: "baseline" },
  qualityValue: {
    ...typography.metricBig,
    fontSize: 34,
    lineHeight: 40,
    color: themeNew.purple,
  },
  qualityLabel: {
    ...typography.caption,
    color: themeNew.textSecondary,
  },
  qualityCaption: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 6,
  },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  stageLabel: {
    ...typography.bodySmall,
    color: themeNew.textPrimary,
    flex: 1,
  },
  stageValue: {
    ...typography.bodySmall,
    color: themeNew.textPrimary,
    fontWeight: "600",
  },
  stagePercent: {
    ...typography.micro,
    color: themeNew.textSecondary,
    width: 44,
    textAlign: "right",
  },
  tip: {
    backgroundColor: themeNew.purpleTint,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: 4,
  },
  tipTitle: {
    ...typography.bodyMedium,
    fontWeight: "600",
    color: themeNew.purpleText,
  },
  tipBody: {
    ...typography.bodySmall,
    color: themeNew.textSecondary,
  },
});
