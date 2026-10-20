import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCard } from "../components/AlertCard";
import { LoadingState } from "../components/LoadingState";
import { SmsLogCard } from "../components/SmsLogCard";
import { EmptyState, ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAlerts } from "../hooks/useAlerts";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Alerts">;

export function AlertsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { alerts, sms, loading, error, reload, acknowledge, feedback } =
    useAlerts(true);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Alerts</Text>
      <Text style={styles.sub}>
        Risk notifications raised by the model. Acknowledging or rating an
        alert improves the recorded outcome.
      </Text>

      {loading ? (
        <LoadingState message="Loading alerts…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts yet"
          message="Alerts appear here when your predicted risk crosses the calibrated band edge."
        />
      ) : (
        alerts.map((a) => (
          <AlertCard
            key={a.id}
            alert={a}
            onAcknowledge={acknowledge}
            onFeedback={feedback}
          />
        ))
      )}

      {sms ? (
        <SmsLogCard
          enabled={sms.sms_enabled}
          provider={sms.sms_provider}
          maxSends={sms.sms_max_sends}
          logs={sms.logs}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
});
