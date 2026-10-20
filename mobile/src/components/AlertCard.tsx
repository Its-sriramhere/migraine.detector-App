import { Pressable, StyleSheet, Text, View } from "react-native";
import { BellRing, Check, ThumbsDown, ThumbsUp, TriangleAlert, X } from "lucide-react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { Alert, AlertFeedback } from "../types";
import { timeAgo } from "../utils/formatting";
import { AdviceList } from "./AdviceList";
import { Card } from "./Card";
import { RiskBadge } from "./RiskBadge";

interface Props {
  alert: Alert;
  onAcknowledge: (id: number) => void;
  onFeedback: (id: number, value: AlertFeedback) => void;
}

export function AlertCard({ alert, onAcknowledge, onFeedback }: Props) {
  const Icon = alert.risk_level === "high" ? BellRing : TriangleAlert;
  const iconColor =
    alert.risk_level === "high" ? colors.high : colors.moderate;

  return (
    <Card>
      <View style={styles.head}>
        <Icon color={iconColor} size={20} />
        <RiskBadge level={alert.risk_level} />
        <View style={styles.spacer} />
        <Text style={styles.time}>{timeAgo(alert.timestamp)}</Text>
      </View>
      <Text style={styles.message}>{alert.message}</Text>
      <AdviceList advice={alert.advice} title="What to do now" />

      {alert.acknowledged ? (
        <Text style={styles.ack}>
          {alert.feedback
            ? `Acknowledged · Feedback: ${alert.feedback.replace("_", " ")}`
            : "Acknowledged"}
        </Text>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onAcknowledge(alert.id)}
            style={styles.action}
          >
            <Check color={colors.primary} size={16} />
            <Text style={styles.actionText}>Acknowledge</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Did this alert match reality? Yes"
            onPress={() => onFeedback(alert.id, "yes")}
            style={styles.iconAction}
          >
            <ThumbsUp color={colors.textSecondary} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Did this alert match reality? No"
            onPress={() => onFeedback(alert.id, "no")}
            style={styles.iconAction}
          >
            <ThumbsDown color={colors.textSecondary} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Did this alert match reality? Not sure"
            onPress={() => onFeedback(alert.id, "not_sure")}
            style={styles.iconAction}
          >
            <X color={colors.textSecondary} size={18} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  spacer: { flex: 1 },
  time: { ...typography.caption, color: colors.textTertiary },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  actionText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  iconAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ack: { ...typography.caption, color: colors.success, marginTop: spacing.md },
});
