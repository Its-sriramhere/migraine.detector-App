import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { RiskHistoryChart } from "../components/RiskHistoryChart";
import { EmptyState, ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useRisk } from "../hooks/useRisk";
import { formatTimestamp } from "../utils/formatting";
import type { MainTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<MainTabParamList, "History">;

export function HistoryScreen(_: Props) {
  const insets = useSafeAreaInsets();
  const { history, loading, error, reload } = useRisk(true);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Risk History</Text>
      <Text style={styles.sub}>
        Every risk estimate produced by the model, newest first.
      </Text>

      {loading ? (
        <LoadingState message="Loading history…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : history.length === 0 ? (
        <EmptyState
          title="No monitoring history yet"
          message="Start monitoring to see your historical risk information here."
        />
      ) : (
        <>
          <RiskHistoryChart predictions={history} />
          {history.map((h) => (
            <Card key={h.id}>
              <View style={styles.row}>
                <Text style={styles.time}>
                  {formatTimestamp(h.timestamp)}
                </Text>
                <RiskBadge level={h.risk_level} small />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>Score {Math.round(h.risk_score)}%</Text>
                <Text style={styles.meta}>Window {h.prediction_window} min</Text>
                <Text style={styles.meta}>Source {h.source}</Text>
              </View>
              <Text style={styles.model}>Model {h.model_version}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: 4,
  },
  meta: { ...typography.caption, color: colors.textSecondary },
  model: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
});
