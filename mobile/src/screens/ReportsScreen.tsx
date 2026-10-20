import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { BarRow, StatTile } from "../components/StatTile";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useReports } from "../hooks/useReports";
import { CSV_EXPORTS } from "../services/reportService";
import { exportCsv } from "../services/exportService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Reports">;

export function ReportsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { overview, loading, error, reload } = useReports(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const doExport = async (key: string, path: string, filename: string) => {
    setExporting(key);
    setExportNote(null);
    try {
      const res = await exportCsv(path, filename);
      setExportNote(
        res.shared
          ? `${filename} ready to share.`
          : `${filename} saved to ${res.uri}`,
      );
    } catch (e) {
      setExportNote(
        e instanceof Error ? e.message : "Export failed. Try again.",
      );
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <LoadingState message="Loading reports…" />;
  if (error || !overview)
    return <ErrorState message={error ?? "No report data."} onRetry={reload} />;

  const bands = overview.risk_band_counts ?? {};
  const bandMax = Math.max(1, ...Object.values(bands).map((v) => Number(v)));

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <AppHeader title="Reports" layout="left" titleStyle={styles.title} onBack={() => navigation.goBack()} />
      <Text style={styles.sub}>
        Aggregate usage statistics for this account. Exports are shared as CSV
        files.
      </Text>

      <View style={styles.tiles}>
        <StatTile label="Readings" value={overview.total_readings} />
        <StatTile label="Predictions" value={overview.total_predictions} />
        <StatTile label="Alerts" value={overview.total_alerts} />
        <StatTile label="Episodes" value={overview.total_episodes} />
        <StatTile label="Days monitored" value={overview.days_monitored} />
        <StatTile
          label="Average risk"
          value={
            overview.average_risk !== undefined
              ? `${overview.average_risk}%`
              : "—"
          }
        />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Latest status</Text>
        <Text style={styles.cardText}>
          {overview.latest_risk_score !== undefined
            ? `${Math.round(overview.latest_risk_score)}% · ${(overview.latest_risk_level ?? "—").toUpperCase()}`
            : "No prediction yet."}
        </Text>
      </Card>

      <Text style={styles.section}>Risk band distribution</Text>
      <Card>
        <BarRow
          label="Low"
          value={Number(bands.low ?? 0)}
          max={bandMax}
          color={colors.low}
        />
        <BarRow
          label="Moderate"
          value={Number(bands.moderate ?? 0)}
          max={bandMax}
          color={colors.moderate}
        />
        <BarRow
          label="High"
          value={Number(bands.high ?? 0)}
          max={bandMax}
          color={colors.high}
        />
      </Card>

      <Text style={styles.section}>Export</Text>
      <Card>
        {CSV_EXPORTS.map((c) => (
          <View key={c.key} style={styles.exportRow}>
            <Button
              title={c.label}
              variant="secondary"
              loading={exporting === c.key}
              onPress={() => void doExport(c.key, c.path, c.filename)}
            />
          </View>
        ))}
        {exportNote ? (
          <Text style={styles.exportNote}>{exportNote}</Text>
        ) : null}
        <Text style={styles.hint}>
          On mobile, exports open the system share sheet so you can save them
          to Files, email them, or share them.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  section: { ...typography.h2, color: colors.textPrimary },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardText: { ...typography.bodySmall, color: colors.textSecondary },
  exportRow: { marginBottom: spacing.sm },
  exportNote: { ...typography.caption, color: colors.success },
  hint: { ...typography.caption, color: colors.textTertiary },
});
