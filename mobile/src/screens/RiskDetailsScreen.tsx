import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdviceList } from "../components/AdviceList";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { RiskGauge } from "../components/RiskGauge";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useExplanation, useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "RiskDetails">;

function contributionLabel(c: number): string {
  const a = Math.abs(c);
  if (a >= 30) return "High contribution";
  if (a >= 12) return "Moderate contribution";
  return "Lower contribution";
}

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

  const raw = (explanation.data?.features ?? prediction.features).slice(0, 6);
  const factors = raw.map((f, i) => {
    if ("feature_name" in f) {
      return {
        key: String(f.id ?? i),
        name: f.feature_name,
        value: f.feature_value,
        contribution: f.contribution,
      };
    }
    return {
      key: `${f.name}-${i}`,
      name: f.name,
      value: f.value,
      contribution: f.contribution,
    };
  });

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Card>
        <Text style={styles.cardTitle}>Predicted Migraine Risk</Text>
        <View style={styles.gaugeWrap}>
          <RiskGauge
            score={prediction.risk_score}
            level={prediction.risk_level}
            label={prediction.prediction_window ? `next ${prediction.prediction_window} min` : undefined}
          />
        </View>
        <View style={styles.metaRow}>
          <RiskBadge level={prediction.risk_level} small />
          <Text style={styles.meta}>Model {prediction.model_version}</Text>
          <Text style={styles.meta}>Source {prediction.source}</Text>
        </View>
        <AdviceList advice={prediction.advice} />
      </Card>

      <Text style={styles.h}>Why is my risk changing?</Text>
      <Text style={styles.sub}>
        Contributing factors from the model explanation. These describe model
        influence, not medical causation.
      </Text>
      {factors.length === 0 ? (
        <Card>
          <Text style={styles.sub}>
            No factor deviated from your personal baseline in this prediction.
          </Text>
        </Card>
      ) : (
        factors.map((f) => (
          <Card key={f.key}>
            <View style={styles.factorHead}>
              <Text style={styles.name}>{f.name}</Text>
              <Text style={styles.contrib}>
                {contributionLabel(f.contribution)}
              </Text>
            </View>
            <Text style={styles.value}>
              {f.value !== undefined ? `Value ${f.value} · ` : ""}
              contribution {f.contribution.toFixed(2)}
            </Text>
          </Card>
        ))
      )}

      <Button
        title="View detailed explanation"
        onPress={() =>
          navigation.navigate("Explanation", { predictionId: prediction.id })
        }
      />

      {history.length > 0 ? (
        <>
          <Text style={styles.h}>Recent history</Text>
          {history.slice(0, 5).map((h) => (
            <Text key={h.id} style={styles.hist}>
              {h.timestamp ?? ""} — {h.risk_level.toUpperCase()} (
              {Math.round(h.risk_score)}%)
            </Text>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  gaugeWrap: { alignItems: "center", marginVertical: spacing.base },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  meta: { ...typography.caption, color: colors.textTertiary },
  h: { ...typography.h2, color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  factorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { fontWeight: "600", color: colors.textPrimary },
  contrib: { color: colors.textSecondary, fontSize: 13 },
  value: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  hist: { color: colors.textSecondary, fontSize: 13 },
});
