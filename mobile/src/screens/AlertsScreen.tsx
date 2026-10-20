import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, AlertTriangle, ArrowUpRight, Droplets, Heart, Moon } from "lucide-react-native";
import { AlertCard } from "../components/AlertCard";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { PageTitle } from "../components/PageTitle";
import { PrimaryButton } from "../components/PrimaryButton";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors, riskColors, riskHeadline } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAlerts } from "../hooks/useAlerts";
import { useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";
import { riskSentence } from "../utils/formatting";

type Props = NativeStackScreenProps<RootStackParamList, "Alerts">;

type Tab = "all" | "insights" | "alerts";

const TABS: { label: string; value: Tab }[] = [
  { label: "All", value: "all" },
  { label: "Insights", value: "insights" },
  { label: "Alerts", value: "alerts" },
];

/** Friendly label + supporting line for a model feature. */
function factorCopy(name: string, value?: number): { title: string; body: string } {
  const key = name.toLowerCase();
  if (key.includes("hrv")) {
    return {
      title: "Lower HRV",
      body:
        value !== undefined
          ? `${Math.round(Math.abs(value))} ms · lower than usual`
          : "lower than usual",
    };
  }
  if (key.includes("hr") || key.includes("heart")) {
    return {
      title: "Higher heart rate",
      body:
        value !== undefined
          ? `${Math.round(Math.abs(value))} · above your normal range`
          : "above your normal range",
    };
  }
  if (key.includes("bp") || key.includes("blood")) {
    return {
      title: "Blood pressure pattern",
      body:
        value !== undefined
          ? `${Math.round(Math.abs(value))} · reading slightly elevated`
          : "reading slightly elevated",
    };
  }
  if (key.includes("temp")) {
    return {
      title: "Temperature change",
      body:
        value !== undefined
          ? `${Math.abs(value).toFixed(2)} °C · shifted from baseline`
          : "shifted from baseline",
    };
  }
  if (key.includes("spo2") || key.includes("oxygen")) {
    return {
      title: "Blood oxygen saturation",
      body:
        value !== undefined
          ? `${Math.round(value)}% · within normal range`
          : "within normal range",
    };
  }
  if (key.includes("sleep")) {
    return {
      title: "Shorter sleep",
      body:
        value !== undefined
          ? `${Math.round(value)} min · below your target`
          : "below your target",
    };
  }
  return { title: name, body: "influenced this estimate" };
}

function factorIcon(title: string) {
  if (title.startsWith("Lower HRV")) {
    return <Heart size={20} color={colors.primary} />;
  }
  if (title.startsWith("Higher heart")) {
    return <Activity size={20} color={colors.primary} />;
  }
  if (title.startsWith("Blood pressure")) {
    return <ArrowUpRight size={20} color={colors.primary} />;
  }
  if (title.startsWith("Blood oxygen")) {
    return <Droplets size={20} color={colors.primary} />;
  }
  return <Moon size={20} color={colors.primary} />;
}

export function AlertsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("all");
  const { alerts, loading, error, reload, acknowledge, feedback } = useAlerts(true);
  const { prediction, loading: riskLoading } = useRisk(true);

  const level = prediction?.risk_level ?? "low";
  const rc = riskColors(level);
  const factors = (prediction?.features ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 4)
    .map((f) => ({ ...factorCopy(f.feature_name, f.feature_value) }));

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <PageTitle title="Insights & Alerts" />

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Pressable
              key={t.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.value)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {riskLoading && !prediction ? (
        <LoadingState message="Loading insights…" />
      ) : (
        <>
          {tab !== "alerts" ? (
            <>
              <Card style={styles.insightCard}>
                <IconCircle
                  size={48}
                  background={rc.solid}
                  color={rc.indicator}
                >
                  <AlertTriangle size={22} color={rc.indicator} />
                </IconCircle>
                <View style={styles.insightHead}>
                  <Text style={[styles.insightTitle, { color: rc.text }]}>
                    {riskHeadline(level).replace(" RISK", "")} signal detected
                  </Text>
                  <Text style={styles.insightSub}>
                    Based on your most recent wearable signals
                  </Text>
                </View>
                <Text style={styles.insightBody}>
                  {prediction
                    ? riskSentence(level, prediction.risk_score)
                    : "No prediction yet."}
                </Text>
                <PrimaryButton
                  title="View risk details →"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("RiskDetails", {
                      predictionId: prediction?.id,
                    })
                  }
                />
              </Card>

              <Text style={styles.section}>Key Factors</Text>
              {factors.length === 0 ? (
                <Card>
                  <Text style={styles.insightSub}>
                    No factor deviated from your baseline in the latest
                    prediction.
                  </Text>
                </Card>
              ) : (
                factors.map((f) => (
                  <Card key={f.title} style={styles.factorCard}>
                    <IconCircle
                      size={48}
                      background={colors.blueTint}
                      color={colors.primary}
                    >
                      {factorIcon(f.title)}
                    </IconCircle>
                    <View style={styles.factorText}>
                      <Text style={styles.factorTitle}>{f.title}</Text>
                      <Text style={styles.factorBody}>{f.body}</Text>
                    </View>
                  </Card>
                ))
              )}
            </>
          ) : null}

          {tab !== "insights" ? (
            <>
              <Text style={styles.section}>Alerts ({alerts.length})</Text>
              {loading ? (
                <LoadingState message="Loading alerts…" />
              ) : error ? (
                <ErrorState message={error} onRetry={reload} />
              ) : alerts.length === 0 ? (
                <Card>
                  <Text style={styles.insightSub}>
                    No alerts yet. Alerts appear here when your predicted risk
                    crosses the calibrated band edge.
                  </Text>
                </Card>
              ) : (
                alerts.map((a) => (
                  <AlertCard
                    key={a.id}
                    alert={a}
                    onAcknowledge={acknowledge}
                    onFeedback={feedback}
                  />
                ))
              )}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.md },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodyMedium, color: colors.textSecondary },
  tabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  insightCard: {
    backgroundColor: colors.moderatePale,
    borderColor: colors.moderateBackground,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  insightHead: { gap: 1 },
  insightTitle: { ...typography.section },
  insightSub: { ...typography.bodySmall, color: colors.textSecondary },
  insightBody: { ...typography.body, color: colors.textPrimary },
  section: { ...typography.section, color: colors.textPrimary, marginTop: spacing.sm },
  factorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.card,
  },
  factorText: { flex: 1, gap: 1 },
  factorTitle: { ...typography.rowTitle, color: colors.textPrimary },
  factorBody: { ...typography.bodySmall, color: colors.textSecondary },
});
