import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Info } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { ArcGauge } from "../components/ArcGauge";
import { AdviceList } from "../components/AdviceList";
import { LoadingState } from "../components/LoadingState";
import { RiskHistoryChart } from "../components/RiskHistoryChart";
import { StatusCard } from "../components/StatusCard";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useExplanation, useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "RiskDetails">;

export function RiskDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { prediction, history, loading, error, reload } = useRisk(true);
  const currentId = route.params?.predictionId ?? prediction?.id ?? null;
  const explanation = useExplanation(currentId);

  if (loading && !prediction)
    return <LoadingState message="Loading risk…" />;
  if (error && !prediction)
    return <ErrorState message={error} onRetry={reload} />;
  if (!prediction)
    return <ErrorState message="No predictions yet." onRetry={reload} />;

  const level = prediction.risk_level;
  const raw = (explanation.data?.features ?? prediction.features).slice(0, 6);
  const factors = raw.map((f, i) => {
    if ("feature_name" in f) {
      return { key: String(f.id ?? i), name: f.feature_name, contribution: f.contribution };
    }
    return { key: `${f.name}-${i}`, name: f.name, contribution: f.contribution };
  });

  const stable = level === "low";

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm },
      ]}
    >
      <AppHeader
        title="Migraine Risk"
        onBack={() => navigation.goBack()}
        right={
          <Info color={colors.textSecondary} size={20} />
        }
      />

      <View style={styles.gaugeWrap}>
        <ArcGauge
          score={prediction.risk_score}
          level={level}
          caption="Estimated risk over the next 24h"
        />
      </View>

      <View style={styles.explain}>
        <Text style={styles.explainText}>
          Your wearable signals currently suggest a{" "}
          <Text style={styles.explainStrong}>
            {stable ? "low" : level === "moderate" ? "moderate" : "high"}{" "}
            likelihood
          </Text>{" "}
          of a migraine episode.
        </Text>
      </View>

      {factors.length > 0 ? (
        <View style={styles.factors}>
          {factors.map((f) => (
            <View key={f.key} style={styles.factorRow}>
              <Text style={styles.factorName}>{f.name}</Text>
              <Text style={styles.factorValue}>
                {f.contribution >= 0 ? "+" : ""}
                {f.contribution.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.section}>7-day Risk Trend</Text>
      <RiskHistoryChart predictions={history} />

      <AdviceList advice={prediction.advice} title="Recommended next steps" />

      <StatusCard
        icon={<Check size={18} color={colors.low} strokeWidth={3} />}
        title={
          stable
            ? "All signals are currently stable."
            : "Some signals are outside your normal range."
        }
        body={
          stable
            ? "Keep your healthy routine going."
            : "Review your recommendations and stay hydrated."
        }
        background={stable ? colors.lowPale : colors.moderatePale}
        iconBackground={stable ? colors.lowBackground : colors.moderateBackground}
        iconColor={stable ? colors.low : colors.moderate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  gaugeWrap: { alignItems: "center", marginVertical: spacing.sm },
  explain: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: spacing.base,
  },
  explainText: { ...typography.caption, color: colors.textSecondary },
  explainStrong: { color: colors.textPrimary, fontWeight: "600" },
  factors: { gap: 4 },
  factorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  factorName: { ...typography.bodySmall, color: colors.textSecondary },
  factorValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  section: { ...typography.section, color: colors.textPrimary },
});
