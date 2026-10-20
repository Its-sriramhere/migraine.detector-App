import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdviceList } from "../components/AdviceList";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useExplanation, useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Explanation">;

export function ExplanationScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { prediction } = useRisk(true);
  const { data, loading, error } = useExplanation(route.params.predictionId);

  if (loading) return <LoadingState message="Loading explanation…" />;
  if (error || !data)
    return <ErrorState message={error ?? "No explanation available."} />;

  const sorted = [...data.features].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );

  const summary =
    data.risk_level === "high"
      ? "Your predicted risk is elevated relative to your baseline. The factors below contributed most to that estimate."
      : data.risk_level === "moderate"
        ? "Your predicted risk is moderately above baseline. The factors below contributed most to that estimate."
        : "Your predicted risk is within the low band. The factors below still show what the model weighed.";

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Model explanation</Text>
      <View style={styles.headRow}>
        <Text style={styles.score}>{Math.round(data.risk_score)}%</Text>
        <RiskBadge level={data.risk_level} />
      </View>
      <Text style={styles.sub}>
        {summary} SHAP-style contributions show how each factor influenced this
        prediction — they describe model influence, not medical causation.
      </Text>

      {prediction ? (
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Model {prediction.model_version}</Text>
          <Text style={styles.meta}>Window {prediction.prediction_window} min</Text>
          <Text style={styles.meta}>Source {prediction.source}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Feature importance</Text>
      {sorted.length === 0 ? (
        <Card>
          <Text style={styles.sub}>
            No feature deviated from your personal baseline in this prediction,
            so the model reported no contributions. This is expected when every
            reading sits inside your normal range.
          </Text>
        </Card>
      ) : (
        sorted.map((f) => {
          const width = Math.min(
            100,
            Math.round(Math.abs(f.contribution) * 100),
          );
          return (
            <Card key={f.name}>
              <View style={styles.factorHead}>
                <Text style={styles.name}>{f.name}</Text>
                <Text
                  style={[
                    styles.contribution,
                    {
                      color:
                        f.contribution >= 0 ? colors.highText : colors.lowText,
                    },
                  ]}
                >
                  {f.contribution >= 0 ? "+" : ""}
                  {f.contribution.toFixed(3)}
                </Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.fill, { width: `${width}%` }]} />
              </View>
            </Card>
          );
        })
      )}

      {sorted.length > 0 ? (
        <>
          <Text style={styles.section}>Feature values</Text>
          <Card>
            {sorted.map((f) => (
              <View key={f.name} style={styles.valueRow}>
                <Text style={styles.valueName}>{f.name}</Text>
                <Text style={styles.valueValue}>
                  {f.value !== undefined ? String(f.value) : "—"}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {prediction?.advice?.length ? (
        <>
          <Text style={styles.section}>Advice</Text>
          <AdviceList advice={prediction.advice} title="Calming steps" />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  score: { fontSize: 32, fontWeight: "700", color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  meta: { ...typography.caption, color: colors.textTertiary },
  section: { ...typography.h2, color: colors.textPrimary },
  factorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { fontWeight: "600", color: colors.textPrimary },
  contribution: { ...typography.bodySmall, fontWeight: "700" },
  bar: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  fill: { height: 8, backgroundColor: colors.primary },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  valueName: { ...typography.bodySmall, color: colors.textSecondary },
  valueValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
});
