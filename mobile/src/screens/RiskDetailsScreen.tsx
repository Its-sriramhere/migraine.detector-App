import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { RiskCard } from "../components/RiskCard";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useExplanation, useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "RiskDetails">;

function contributionLabel(c: number): string {
  const a = Math.abs(c);
  if (a >= 0.3) return "High contribution";
  if (a >= 0.12) return "Moderate contribution";
  return "Lower contribution";
}

export function RiskDetailsScreen({ navigation, route }: Props) {
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
      return { key: String(f.id ?? i), name: f.feature_name, contribution: f.contribution };
    }
    return { key: `${f.name}-${i}`, name: f.name, contribution: f.contribution };
  });

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <RiskCard
        score={prediction.risk_score}
        level={prediction.risk_level}
        timestamp={prediction.timestamp}
      />
      <Text style={styles.h}>Why is my risk changing?</Text>
      <Text style={styles.sub}>
        Contributing factors from the model explanation. These describe model
        influence, not medical causation.
      </Text>
      {factors.map((f) => (
        <View key={f.key} style={styles.row}>
          <Text style={styles.name}>{f.name}</Text>
          <Text style={styles.contrib}>
            {contributionLabel(f.contribution)}
          </Text>
        </View>
      ))}
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
  h: { ...typography.h2, color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
  },
  name: { fontWeight: "600", color: colors.textPrimary },
  contrib: { color: colors.textSecondary, fontSize: 13 },
  hist: { color: colors.textSecondary, fontSize: 13 },
});
