import { ScrollView, StyleSheet, Text } from "react-native";
import { LoadingState } from "../components/LoadingState";
import { EmptyState, ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useRisk } from "../hooks/useRisk";

export function HistoryScreen() {
  const { history, loading, error, reload } = useRisk(true);

  if (loading) return <LoadingState message="Loading history…" />;
  if (error)
    return <ErrorState message={error} onRetry={reload} />;
  if (history.length === 0)
    return (
      <EmptyState
        title="No monitoring history yet"
        message="Start monitoring to see your historical risk information here."
      />
    );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Risk History</Text>
      {history.map((h) => (
        <Text key={h.id} style={styles.row}>
          {h.timestamp ?? ""} — {h.risk_level.toUpperCase()} (
          {Math.round(h.risk_score)}%)
        </Text>
      ))}
      <Text style={styles.note}>
        MVP list view. Date filtering, trend chart and historical explanations
        land in Phase 2.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  row: { color: colors.textSecondary, fontSize: 14 },
  note: { color: colors.textTertiary, fontSize: 12, marginTop: 8 },
});
