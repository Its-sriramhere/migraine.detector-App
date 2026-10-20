import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useExplanation } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Explanation">;

export function ExplanationScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { data, loading, error } = useExplanation(route.params.predictionId);

  if (loading) return <LoadingState message="Loading explanation…" />;
  if (error || !data)
    return <ErrorState message={error ?? "No explanation available."} />;

  const sorted = [...data.features].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Model explanation</Text>
      <Text style={styles.sub}>
        Predicted risk {Math.round(data.risk_score)}% (
        {data.risk_level.toUpperCase()}). SHAP-style contributions below show
        how each factor influenced this prediction — not medical causation.
      </Text>
      {sorted.map((f) => {
        const width = Math.min(
          100,
          Math.round(Math.abs(f.contribution) * 100),
        );
        return (
          <View key={f.name} style={styles.row}>
            <Text style={styles.name}>{f.name}</Text>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${width}%` }]} />
            </View>
            <Text style={styles.val}>
              {f.value !== undefined ? String(f.value) : "—"} ·{" "}
              {f.contribution.toFixed(3)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
    gap: 6,
  },
  name: { fontWeight: "600", color: colors.textPrimary },
  bar: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: colors.primary },
  val: { fontSize: 12, color: colors.textSecondary },
});
