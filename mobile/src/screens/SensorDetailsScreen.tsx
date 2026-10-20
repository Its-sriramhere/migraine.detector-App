import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MetricChart } from "../components/MetricChart";
import { LoadingState } from "../components/LoadingState";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useSensorData } from "../hooks/useSensorData";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SensorDetails">;

export function SensorDetailsScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sensorHistory, loading } = useSensorData(user?.id ?? null, "live");
  const metric = route.params.metric;

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
      <Text style={styles.title}>
        {metric.replace("_", " ")}
      </Text>
      <MetricChart metric={metric} readings={sensorHistory} limit={100} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
});
