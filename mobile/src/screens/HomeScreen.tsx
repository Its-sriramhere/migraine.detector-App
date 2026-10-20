import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdviceList } from "../components/AdviceList";
import { AlertCard } from "../components/AlertCard";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DemoBanner } from "../components/DemoBanner";
import { LoadingState } from "../components/LoadingState";
import { PiStatus } from "../components/PiStatus";
import { RiskGauge } from "../components/RiskGauge";
import { SensorGrid } from "../components/SensorGrid";
import { EmptyState, ErrorState, OfflineBanner } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useNetwork } from "../hooks/useNetwork";
import { useSensorData } from "../hooks/useSensorData";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/types";
import { greetingFor } from "../utils/date";
import { timeAgo } from "../utils/formatting";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const online = useNetwork();
  const {
    mode,
    prediction,
    latestReading,
    sensorHistory,
    devices,
    alerts,
    connected,
    loading,
    error,
    lastSync,
    refresh,
    acknowledgeAlert,
    sendFeedback,
  } = useSensorData(user?.id ?? null, "live");

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const statusColor = connected ? colors.low : colors.textTertiary;

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>
            {greetingFor()}, {firstName}
          </Text>
          <Text style={styles.conn} accessibilityLabel={connected ? "Live connection active" : "Live connection inactive"}>
            {connected ? "● Live connection" : "○ Polling fallback"}
          </Text>
        </View>
        <View style={[styles.connDot, { backgroundColor: statusColor }]} />
      </View>

      {online === false ? <OfflineBanner lastSync={lastSync} /> : null}
      {mode === "demo" ? <DemoBanner /> : null}

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
              label={
                prediction.prediction_window
                  ? `next ${prediction.prediction_window} min`
                  : undefined
              }
            />
          </View>
          <Text style={styles.sub}>
            {prediction.timestamp
              ? `Based on measurements ${timeAgo(prediction.timestamp)}`
              : "Based on latest measurements"}
          </Text>
          <AdviceList advice={prediction.advice} />
          <Button
            title="View Explanation"
            onPress={() =>
              navigation.navigate("RiskDetails", { predictionId: prediction.id })
            }
          />
        </Card>
      ) : (
        <EmptyState
          title="No monitoring data yet"
          message="Start monitoring to see your predicted risk here."
          actionLabel="Open Monitoring"
          onAction={() => navigation.navigate("Monitoring" as never)}
        />
      )}

      {alerts.length > 0 ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.section}>Recent alerts</Text>
            <Button
              title="See all"
              variant="secondary"
              onPress={() => navigation.navigate("Alerts")}
            />
          </View>
          {alerts.slice(0, 3).map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onAcknowledge={acknowledgeAlert}
              onFeedback={sendFeedback}
            />
          ))}
        </>
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
              onPress: () =>
                navigation.navigate("SensorDetails", { metric: "heart_rate" }),
            },
            {
              icon: "💓",
              name: "HRV",
              value: String(latestReading.hrv ?? "—"),
              unit: "ms",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
              onPress: () =>
                navigation.navigate("SensorDetails", { metric: "hrv" }),
            },
            {
              icon: "🩸",
              name: "SpO₂",
              value: String(latestReading.spo2 ?? "—"),
              unit: "%",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
              onPress: () =>
                navigation.navigate("SensorDetails", { metric: "spo2" }),
            },
            {
              icon: "🌡️",
              name: "Temperature",
              value: String(latestReading.temperature ?? "—"),
              unit: "°C",
              status: mode === "demo" ? "demo" : "live",
              updatedAt: latestReading.timestamp,
              onPress: () =>
                navigation.navigate("SensorDetails", { metric: "temperature" }),
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

      <View style={styles.actions}>
        <Button
          title="View Monitoring"
          onPress={() => navigation.navigate("Monitoring" as never)}
        />
      </View>
      <Text style={styles.footnote}>
        {sensorHistory.length} readings in the loaded window · research
        prototype, not a medical device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  headRow: { flexDirection: "row", alignItems: "center" },
  hello: { ...typography.h1, color: colors.textPrimary },
  conn: { ...typography.caption, color: colors.textSecondary },
  connDot: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  gaugeWrap: { alignItems: "center", marginVertical: spacing.base },
  sub: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: { ...typography.h2, color: colors.textPrimary },
  actions: { paddingBottom: spacing.sm },
  footnote: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
