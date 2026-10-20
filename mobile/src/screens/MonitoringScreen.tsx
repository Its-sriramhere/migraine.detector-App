import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Droplets, HeartPulse, Moon, Wind } from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import { TabBackButton } from "../components/TabBackButton";
import { BigMetricCard } from "../components/BigMetricCard";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { ErrorState, OfflineBanner } from "../components/States";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useNetwork } from "../hooks/useNetwork";
import { useSensorData } from "../hooks/useSensorData";
import type { BaselineEstimates } from "../types";
import * as userService from "../services/userService";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/types";
import { formatSleep, formatTimestamp } from "../utils/formatting";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Monitoring">,
  NativeStackScreenProps<RootStackParamList>
>;

type MetricKey = "sleep" | "hrv" | "bp" | "spo2";

const TABS: { label: string; value: MetricKey }[] = [
  { label: "Sleep", value: "sleep" },
  { label: "HRV", value: "hrv" },
  { label: "Blood Pressure", value: "bp" },
  { label: "SpO₂", value: "spo2" },
];

const METRIC_COLOR: Record<MetricKey, string> = {
  sleep: colors.lavenderStrong,
  hrv: colors.accent,
  bp: colors.primary,
  spo2: colors.low,
};

export function MonitoringScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const online = useNetwork();
  const [metric, setMetric] = useState<MetricKey>("sleep");
  const [baseline, setBaseline] = useState<BaselineEstimates | null>(null);
  const {
    mode,
    prediction,
    latestReading,
    sensorHistory,
    loading,
    error,
    lastSync,
    refresh,
  } = useSensorData(user?.id ?? null, "live");

  useEffect(() => {
    userService.getBaseline().then(setBaseline).catch(() => undefined);
  }, []);

  const pick = (key: MetricKey) => {
    if (key === "sleep") return []; // sleep history arrives with the wearable
    const list = sensorHistory.map((r) => {
      if (key === "hrv") return r.hrv ?? null;
      if (key === "bp") return r.systolic_bp ?? null;
      if (key === "spo2") return r.spo2 ?? null;
      return r.activity ?? null;
    });
    return list.filter((v): v is number => v !== null).slice(-24);
  };

  const series = pick(metric);
  const chartData = series.map((v) => ({ value: v }));

  const value =
    metric === "sleep"
      ? formatSleep(
          baseline?.sleep_hours !== undefined
            ? baseline.sleep_hours * 60
            : undefined,
        )
      : metric === "hrv"
        ? latestReading?.hrv !== undefined
          ? `${Math.round(latestReading.hrv)} ms`
          : "—"
        : metric === "bp"
          ? latestReading?.systolic_bp && latestReading?.diastolic_bp
            ? `${latestReading.systolic_bp}/${latestReading.diastolic_bp}`
            : "—"
          : latestReading?.spo2 !== undefined
            ? `${Math.round(latestReading.spo2)}%`
            : "—";

  const goal =
    metric === "sleep"
      ? "Goal: 7–9 hours"
      : metric === "hrv"
        ? "Compared with your personal baseline"
        : metric === "bp"
          ? "mmHg · compared with your baseline"
          : "Compared with your personal baseline";

  const icon =
    metric === "sleep" ? (
      <Moon size={22} color={colors.lavenderStrong} />
    ) : metric === "hrv" ? (
      <HeartPulse size={22} color={colors.high} />
    ) : metric === "bp" ? (
      <Wind size={22} color={colors.primary} />
    ) : (
      <Droplets size={22} color={colors.accent} />
    );

  const status =
    metric === "sleep"
      ? { label: "TRACKED", text: colors.primaryDark, background: colors.primaryLight }
      : metric === "spo2"
        ? { label: "NORMAL", text: colors.lowDark, background: colors.lowBackground }
        : { label: "LIVE", text: colors.primaryDark, background: colors.primaryLight };

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <View style={styles.titleRow}>
        <TabBackButton onPress={() => navigation.navigate("Home")} />
        <Text style={styles.title}>Health Metrics</Text>
      </View>

      <View style={styles.dateRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous day" style={styles.dateArrow}>
          <ChevronLeft color={colors.textTertiary} size={18} />
        </Pressable>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
              .toUpperCase()
              .replace(",", " ·")}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Next day" style={styles.dateArrow}>
          <ChevronRight color={colors.textTertiary} size={18} />
        </Pressable>
      </View>

      <SegmentedTabs options={TABS} value={metric} onChange={setMetric} />

      {online === false ? <OfflineBanner lastSync={lastSync} /> : null}

      {loading && !latestReading ? (
        <LoadingState message="Loading metrics…" />
      ) : error && !latestReading ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          <BigMetricCard
            icon={icon}
            title={
              metric === "sleep"
                ? "Sleep"
                : metric === "hrv"
                  ? "HRV"
                  : metric === "bp"
                    ? "Blood Pressure"
                    : "SpO₂"
            }
            value={value}
            statusLabel={status.label}
            statusText={status.text}
            statusBackground={status.background}
            goal={goal}
          >
            {chartData.length > 1 ? (
              <View style={styles.chart}>
                <BarChart
                  data={chartData}
                  barWidth={7}
                  spacing={Math.max(6, 250 / chartData.length)}
                  height={110}
                  frontColor={METRIC_COLOR[metric]}
                  roundedTop
                  initialSpacing={4}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  noOfSections={4}
                  rulesColor={colors.border}
                  rulesType="solid"
                />
              </View>
            ) : (
              <Text style={styles.noChart}>
                {metric === "sleep"
                  ? "Sleep history appears once your wearable reports it."
                  : "Not enough readings yet to draw a trend."}
              </Text>
            )}
          </BigMetricCard>

          <Card>
            <Text style={styles.cardTitle}>Recent readings</Text>
            {sensorHistory.length === 0 ? (
              <Text style={styles.noChart}>No readings yet.</Text>
            ) : (
              sensorHistory
                .slice(-6)
                .reverse()
                .map((r) => (
                  <View key={r.id} style={styles.readingRow}>
                    <Text style={styles.readingTime}>
                      {formatTimestamp(r.timestamp)}
                    </Text>
                    <Text style={styles.readingValue}>
                      {r.heart_rate !== undefined ? `${r.heart_rate} BPM` : "—"}
                      {r.hrv !== undefined ? ` · ${Math.round(r.hrv)} ms` : ""}
                      {r.spo2 !== undefined ? ` · ${Math.round(r.spo2)}%` : ""}
                    </Text>
                  </View>
                ))
            )}
          </Card>

          {prediction ? (
            <Card>
              <Text style={styles.cardTitle}>Predicted migraine risk</Text>
              <Text style={styles.riskValue}>
                {Math.round(prediction.risk_score)}% ·{" "}
                {prediction.risk_level.toUpperCase()}
              </Text>
              <Text style={styles.noChart}>
                {mode === "demo"
                  ? "DEMO DATA — simulated measurements."
                  : "Live wearable signals."}
              </Text>
            </Card>
          ) : null}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Watch")}
        style={styles.watchLink}
      >
        <Text style={styles.watchLinkText}>Wearable connection →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { ...typography.title, color: colors.textPrimary },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  dateArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  datePill: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateText: { ...typography.bodyMedium, color: colors.textPrimary },
  chart: { marginTop: spacing.md },
  noChart: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.sm },
  cardTitle: { ...typography.section, color: colors.textPrimary, marginBottom: spacing.sm },
  readingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readingTime: { ...typography.micro, color: colors.textSecondary },
  readingValue: { ...typography.micro, color: colors.textPrimary, fontWeight: "600" },
  riskValue: { ...typography.metric, color: colors.textPrimary },
  watchLink: { alignSelf: "center", padding: spacing.sm },
  watchLinkText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
});
