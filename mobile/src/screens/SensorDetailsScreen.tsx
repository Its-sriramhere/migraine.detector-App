import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MetricChart } from "../components/MetricChart";
import { LoadingState } from "../components/LoadingState";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useSensorData } from "../hooks/useSensorData";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SensorDetails">;

const RANGES = [
  { label: "24H", hours: 24 },
  { label: "7D", hours: 24 * 7 },
  { label: "30D", hours: 24 * 30 },
];

export function SensorDetailsScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sensorHistory, loading } = useSensorData(user?.id ?? null, "live");
  const metric = route.params.metric;
  const [range, setRange] = useState(1);

  const readings = useMemo(() => {
    const hours = RANGES[range].hours;
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return sensorHistory.filter((r) => {
      if (!r.timestamp) return true;
      return new Date(r.timestamp).getTime() >= cutoff;
    });
  }, [sensorHistory, range]);

  if (loading && sensorHistory.length === 0)
    return <LoadingState message="Loading readings…" />;

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>{metric.replace("_", " ")}</Text>

      <View style={styles.tabs}>
        {RANGES.map((r, index) => {
          const active = index === range;
          return (
            <Pressable
              key={r.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setRange(index)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <MetricChart metric={metric} readings={readings} limit={200} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
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
});
