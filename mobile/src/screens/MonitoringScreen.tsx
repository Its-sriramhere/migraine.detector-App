import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DemoBanner } from "../components/DemoBanner";
import { LoadingState } from "../components/LoadingState";
import { MetricChart } from "../components/MetricChart";
import { PiStatus } from "../components/PiStatus";
import { RiskGauge } from "../components/RiskGauge";
import { SensorGrid } from "../components/SensorGrid";
import { ErrorState, OfflineBanner } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useNetwork } from "../hooks/useNetwork";
import { useSensorData, type SensorMode } from "../hooks/useSensorData";
import { timeAgo } from "../utils/formatting";
import * as sensorService from "../services/sensorService";
import type { ScenarioName } from "../types";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Monitoring">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MonitoringScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const online = useNetwork();
  const {
    mode,
    prediction,
    latestReading,
    sensorHistory,
    devices,
    connected,
    loading,
    error,
    lastSync,
    refresh,
    setMode,
  } = useSensorData(user?.id ?? null, "live");
  const [demoBusy, setDemoBusy] = useState(false);
  const [scenario, setScenario] = useState<ScenarioName>("normal");

  const switchMode = async (m: SensorMode) => {
    setMode(m);
    if (m === "demo") {
      setDemoBusy(true);
      try {
        await sensorService.startDemo(scenario);
      } catch {
        // surfaced on next refresh
      } finally {
        setDemoBusy(false);
        void refresh();
      }
    } else {
      try {
        await sensorService.stopDemo();
      } catch {
        // ignore
      } finally {
        void refresh();
      }
    }
  };

  const pi = devices[0];
  const connectedLabel = pi
    ? `● ${pi.status}`
    : loading
      ? "● Checking…"
      : "○ No device";

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Live Monitoring</Text>
      <Text style={styles.status}>
        {connectedLabel} · {connected ? "socket live" : "polling"}
      </Text>

      {online === false ? <OfflineBanner lastSync={lastSync} /> : null}
      {mode === "demo" ? <DemoBanner /> : null}

      <View style={styles.toggle}>
        {(["live", "demo"] as SensorMode[]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === m }}
            onPress={() => void switchMode(m)}
            style={[styles.pill, mode === m && styles.pillActive]}
          >
            <Text style={[styles.pillText, mode === m && styles.pillTextA]}>
              {m === "live" ? "○ Live Raspberry Pi" : "● Demo Mode"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="Open Demo Lab"
        variant="secondary"
        onPress={() => navigation.navigate("Demo")}
      />

      {mode === "demo" ? (
        <View style={styles.scenarios}>
          {(["normal", "moderate", "high"] as ScenarioName[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setScenario(s);
                setDemoBusy(true);
                sensorService
                  .sendScenario(s)
                  .then(() => refresh())
                  .finally(() => setDemoBusy(false));
              }}
              style={[styles.pill, scenario === s && styles.pillActive]}
            >
              <Text style={[styles.pillText, scenario === s && styles.pillTextA]}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading && !prediction ? (
        <LoadingState message="Loading monitoring data…" />
      ) : error && !prediction ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : prediction ? (
        <Card>
          <Text style={styles.cardTitle}>Predicted Migraine Risk</Text>
          <View style={styles.gaugeWrap}>
            <RiskGauge
              score={prediction.risk_score}
              level={prediction.risk_level}
            />
          </View>
          <Text style={styles.sub}>
            {prediction.timestamp
              ? `Based on measurements ${timeAgo(prediction.timestamp)}`
              : "Based on latest measurements"}
          </Text>
        </Card>
      ) : null}

      <MetricChart metric="heart_rate" readings={sensorHistory} />
      <MetricChart metric="hrv" readings={sensorHistory} />
      <MetricChart metric="temperature" readings={sensorHistory} />
      <MetricChart metric="spo2" readings={sensorHistory} />

      {latestReading ? (
        <SensorGrid
          items={[
            {
              icon: "❤️",
              name: "Heart Rate",
              value: String(latestReading.heart_rate ?? "—"),
              unit: "BPM",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
            {
              icon: "💓",
              name: "HRV",
              value: String(latestReading.hrv ?? "—"),
              unit: "ms",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
            {
              icon: "🩸",
              name: "SpO₂",
              value: String(latestReading.spo2 ?? "—"),
              unit: "%",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
            {
              icon: "🌡️",
              name: "Temperature",
              value: String(latestReading.temperature ?? "—"),
              unit: "°C",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
            {
              icon: "💉",
              name: "Blood Pressure",
              value:
                latestReading.systolic_bp && latestReading.diastolic_bp
                  ? `${latestReading.systolic_bp}/${latestReading.diastolic_bp}`
                  : "—",
              unit: "mmHg",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
            {
              icon: "🏃",
              name: "Motion",
              value: String(latestReading.activity ?? "—"),
              unit: "g",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
            },
          ]}
        />
      ) : null}

      <PiStatus devices={devices} />

      <Text style={styles.updated}>
        {lastSync
          ? `Updated ${timeAgo(lastSync)}${demoBusy ? " — switching…" : ""}`
          : ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  status: { color: colors.textSecondary },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  gaugeWrap: { alignItems: "center", marginVertical: spacing.base },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  toggle: { flexDirection: "row", gap: spacing.sm },
  scenarios: { flexDirection: "row", gap: spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: { color: colors.textSecondary, fontWeight: "600" },
  pillTextA: { color: colors.primaryDark },
  updated: { color: colors.textTertiary, fontSize: 12 },
});
