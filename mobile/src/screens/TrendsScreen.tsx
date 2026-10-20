import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { RiskBadge } from "../components/RiskBadge";
import { RiskHistoryChart } from "../components/RiskHistoryChart";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useRisk } from "../hooks/useRisk";
import { formatTimestamp } from "../utils/formatting";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Trends">;

const RANGES = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "ALL", value: 90 },
];

export function TrendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState(7);
  const { history, loading, error, reload } = useRisk(true);

  const windowed = useMemo(() => {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return history.filter((h) => {
      if (!h.timestamp) return true;
      return new Date(h.timestamp).getTime() >= cutoff;
    });
  }, [history, range]);

  const avg =
    windowed.length > 0
      ? windowed.reduce((sum, h) => sum + h.risk_score, 0) / windowed.length
      : null;

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <AppHeader
        title="Trends & Analytics"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {RANGES.map((r) => {
          const active = r.value === range;
          return (
            <Pressable
              key={r.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setRange(r.value)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingState message="Loading trends…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : history.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            No monitoring history yet. Start monitoring to see your historical
            risk information here.
          </Text>
        </Card>
      ) : (
        <>
          <RiskHistoryChart predictions={windowed} limit={90} />

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {avg !== null ? `${Math.round(avg)}%` : "—"}
              </Text>
              <Text style={styles.statLabel}>Average risk</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{windowed.length}</Text>
              <Text style={styles.statLabel}>Predictions</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {windowed.filter((h) => h.risk_level === "high").length}
              </Text>
              <Text style={styles.statLabel}>High risk</Text>
            </View>
          </View>

          <Text style={styles.section}>Predictions</Text>
          {windowed.map((h) => (
            <Card key={h.id} style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.rowTime}>{formatTimestamp(h.timestamp)}</Text>
                <RiskBadge level={h.risk_level} small />
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.meta}>Score {Math.round(h.risk_score)}%</Text>
                <Text style={styles.meta}>Window {h.prediction_window} min</Text>
                <Text style={styles.meta}>Source {h.source}</Text>
              </View>
            </Card>
          ))}
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
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodyMedium, color: colors.textSecondary },
  tabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  statRow: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  statValue: { ...typography.metric, color: colors.textPrimary },
  statLabel: { ...typography.micro, color: colors.textSecondary },
  section: { ...typography.section, color: colors.textPrimary, marginTop: spacing.sm },
  row: { gap: 4 },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTime: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  rowMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  meta: { ...typography.micro, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
});
