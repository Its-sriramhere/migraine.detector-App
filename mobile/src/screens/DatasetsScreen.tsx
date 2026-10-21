import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useDatasets } from "../hooks/useDatasets";
import { useSectionEntrance } from "../hooks/useSectionEntrance";
import * as datasetService from "../services/datasetService";
import { exportCsv } from "../services/exportService";
import { formatTimestamp } from "../utils/formatting";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Datasets">;

function kv(label: string, value: unknown) {
  return (
    <View key={label} style={styles.kvRow}>
      <Text style={styles.kvKey}>{label}</Text>
      <Text style={styles.kvValue}>
        {value === undefined || value === null ? "—" : String(value)}
      </Text>
    </View>
  );
}

export function DatasetsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data, thresholds, loading, error, reload } = useDatasets(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const entrance = useSectionEntrance(7, !loading);

  const run = async (key: string, fn: () => Promise<{ log_tail?: string }>) => {
    setBusy(key);
    setNote(null);
    try {
      const res = await fn();
      setLog(res.log_tail ?? null);
      setNote("Pipeline finished. The live engine hot-reloads thresholds.");
      reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Pipeline failed.");
    } finally {
      setBusy(null);
    }
  };

  const download = async (filename: string) => {
    setNote(null);
    try {
      const res = await exportCsv(
        datasetService.datasetDownloadPath(filename),
        filename,
      );
      setNote(
        res.shared ? `${filename} ready to share.` : `${filename} saved to ${res.uri}`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Download failed.");
    }
  };

  if (loading) return <LoadingState message="Loading datasets…" />;
  if (error || !data)
    return <ErrorState message={error ?? "No dataset data."} onRetry={reload} />;

  const sms = data.storage?.sms;
  const baselines = thresholds?.baselines ?? {};

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <Animated.View style={entrance(0)}>
        <AppHeader title="Datasets & thresholds" layout="left" titleStyle={styles.title} onBack={() => navigation.goBack()} />
      </Animated.View>
      <Animated.View style={entrance(1)}>
        <Text style={styles.sub}>
          The bundled migraine datasets drive the deviation cutoffs and baselines
          the risk engine uses. Recalibrating hot-reloads the live engine.
        </Text>
      </Animated.View>

      <Animated.View style={entrance(2)}>
        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>
              {thresholds?.calibrated ? "CALIBRATED" : "DEFAULTS"}
            </Text>
            <Text style={styles.cardMeta}>
              {data.files.length} files · {data.datasets_dir}
            </Text>
          </View>
          {thresholds ? (
            <>
              {kv("Band low", thresholds.band_edges?.low)}
              {kv("Band high", thresholds.band_edges?.high)}
              {kv("Threshold file", thresholds.path)}
            </>
          ) : null}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.block, entrance(3)]}>
        <Text style={styles.section}>Baselines</Text>
        <Card>
          {Object.entries(baselines).map(([k, v]) => kv(k, v))}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.block, entrance(4)]}>
        <Text style={styles.section}>Files</Text>
        <Card>
          {data.files.map((f) => (
            <View key={f.name} style={styles.fileRow}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{f.name}</Text>
                <Text style={styles.fileMeta}>
                  {f.rows} rows · {(f.size_bytes / 1024).toFixed(1)} KB ·{" "}
                  {f.stored ? "STORED" : "local"} ·{" "}
                  {formatTimestamp(new Date(f.modified * 1000).toISOString())}
                </Text>
              </View>
              <Button
                title="Download"
                variant="secondary"
                onPress={() => void download(f.name)}
              />
            </View>
          ))}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.block, entrance(5)]}>
        <Text style={styles.section}>Pipeline</Text>
        <Card>
          <Button
            title="Rebuild calibration set"
            onPress={() =>
              void run("build", datasetService.rebuildCalibrationDataset)
            }
            loading={busy === "build"}
          />
          <View style={styles.gap} />
          <Button
            title="Recalibrate thresholds"
            variant="secondary"
            onPress={() =>
              void run("calibrate", datasetService.recalibrateThresholds)
            }
            loading={busy === "calibrate"}
          />
          {note ? <Text style={styles.note}>{note}</Text> : null}
          {log ? (
            <View style={styles.logBox}>
              <Text style={styles.logText}>{log}</Text>
            </View>
          ) : null}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.block, entrance(6)]}>
        <Text style={styles.section}>Storage & SMS</Text>
        <Card>
          {kv("Database", data.storage?.database?.label)}
          {kv("Datasets directory", data.storage?.datasets_dir)}
          {kv("Thresholds path", data.storage?.thresholds_path)}
          {kv("SMS provider", sms?.provider)}
          {kv("SMS enabled", sms?.enabled ? "yes" : "no")}
          {kv("SMS recipient", sms?.recipient)}
          {kv("SMS level", sms?.level)}
          {kv(
            "SMS sends",
            `${sms?.sends_used ?? 0} / ${sms?.max_sends ?? 0}`,
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base, flexGrow: 1 },
  block: { gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  section: { ...typography.h2, color: colors.textPrimary },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textTertiary },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  kvKey: { ...typography.bodySmall, color: colors.textSecondary },
  kvValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fileInfo: { flex: 1 },
  fileName: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  fileMeta: { ...typography.caption, color: colors.textTertiary },
  gap: { height: spacing.sm },
  note: { ...typography.caption, color: colors.success, marginTop: spacing.sm },
  logBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  logText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: colors.textSecondary,
  },
});
