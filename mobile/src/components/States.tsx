import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Button } from "./Button";

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button title="Try Again" onPress={onRetry} /> : null}
    </View>
  );
}

export function OfflineBanner({ lastSync }: { lastSync?: string | null }) {
  return (
    <View style={styles.offline}>
      <Text style={styles.offlineTitle}>OFFLINE</Text>
      <Text style={styles.message}>
        Live monitoring is currently unavailable.
        {lastSync ? ` Last synchronized: ${lastSync}.` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: "center" },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  offline: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
    gap: 4,
  },
  offlineTitle: { fontWeight: "700", color: colors.textPrimary },
});
