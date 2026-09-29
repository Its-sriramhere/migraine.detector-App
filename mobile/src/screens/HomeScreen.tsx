import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { DemoBanner } from "../components/DemoBanner";
import { LoadingState } from "../components/LoadingState";
import { PiStatus } from "../components/PiStatus";
import { RiskCard } from "../components/RiskCard";
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

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const online = useNetwork();
  const { mode, prediction, latestReading, devices, loading, error, refresh } =
    useSensorData("live");

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.hello}>
        {greetingFor()}, {firstName}
      </Text>

      {online === false ? <OfflineBanner /> : null}
      {mode === "demo" ? <DemoBanner /> : null}

      {loading && !prediction ? (
        <LoadingState message="Loading monitoring data…" />
      ) : error && !prediction ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : prediction ? (
        <RiskCard
          score={prediction.risk_score}
          level={prediction.risk_level}
          timestamp={prediction.timestamp}
          onPress={() =>
            navigation.navigate("RiskDetails", {
              predictionId: prediction.id,
            })
          }
        />
      ) : (
        <EmptyState
          title="No monitoring data yet"
          message="Start monitoring to see your predicted risk here."
          actionLabel="Open Monitoring"
          onAction={() => navigation.navigate("Monitoring" as never)}
        />
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  hello: { ...typography.h1, color: colors.textPrimary },
  actions: { paddingBottom: spacing.xl },
});
