import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DemoBanner } from "../components/DemoBanner";
import { LoadingState } from "../components/LoadingState";
import { RiskCard } from "../components/RiskCard";
import { SensorGrid } from "../components/SensorGrid";
import { ErrorState, OfflineBanner } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useNetwork } from "../hooks/useNetwork";
import { useSensorData, type SensorMode } from "../hooks/useSensorData";
import { timeAgo } from "../utils/formatting";
import * as sensorService from "../services/sensorService";
import type { ScenarioName } from "../types";

export function MonitoringScreen() {
  const insets = useSafeAreaInsets();
  const online = useNetwork();
  const {
    mode,
    prediction,
    latestReading,
    devices,
    loading,
    error,
    lastSync,
    refresh,
    setMode,
  } = useSensorData("live");
  const [demoBusy, setDemoBusy] = useState(false);
  const [scenario, setScenario] = useState<ScenarioName>("normal");

  const switchMode = async (m: SensorMode) => {
    setMode(m);
    if (m === "demo") {
      setDemoBusy(true);
      try {
        await sensorService.startDemo(scenario);
      } catch {
        // surface via next refresh
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
      <Text style={styles.status}>{connectedLabel}</Text>

      {online === false ? <OfflineBanner lastSync={lastSync} /> : null}
      {mode === "demo" ? <DemoBanner /> : null}

      <View style={styles.toggle}>
        {(["live", "demo"] as SensorMode[]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="radio"
            onPress={() => void switchMode(m)}
            style={[styles.pill, mode === m && styles.pillActive]}
          >
            <Text style={[styles.pillText, mode === m && styles.pillTextA]}>
              {m === "live" ? "○ Live Raspberry Pi" : "● Demo Mode"}
            </Text>
          </Pressable>
        ))}
      </View>

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
              <Text
                style={[styles.pillText, scenario === s && styles.pillTextA]}
              >
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
        <RiskCard
          score={prediction.risk_score}
          level={prediction.risk_level}
          timestamp={prediction.timestamp}
        />
      ) : null}

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
  pillActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  pillText: { color: colors.textSecondary, fontWeight: "600" },
  pillTextA: { color: colors.primaryDark },
  updated: { color: colors.textTertiary, fontSize: 12 },
});
