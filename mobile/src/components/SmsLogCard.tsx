import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { NotificationLog } from "../types";
import { timeAgo } from "../utils/formatting";
import { Card } from "./Card";

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  sent: { bg: colors.lowBackground, fg: colors.lowText },
  skipped: { bg: colors.surfaceSecondary, fg: colors.textSecondary },
  failed: { bg: colors.highBackground, fg: colors.highText },
  quota_exceeded: { bg: colors.moderateBackground, fg: colors.moderateText },
  cooldown: { bg: colors.surfaceSecondary, fg: colors.textTertiary },
};

export function SmsLogRow({ log }: { log: NotificationLog }) {
  const tone = STATUS_TONE[log.status] ?? STATUS_TONE.skipped;
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={styles.level}>{(log.risk_level ?? "").toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]}>
            {log.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>
        <View style={styles.spacer} />
        <Text style={styles.time}>{timeAgo(log.created_at)}</Text>
      </View>
      <Text style={styles.detail}>
        {log.provider}
        {log.recipient ? ` → ${log.recipient}` : ""}
      </Text>
      {log.detail ? <Text style={styles.detail2}>{log.detail}</Text> : null}
    </View>
  );
}

export function SmsLogCard({
  enabled,
  provider,
  maxSends,
  logs,
}: {
  enabled: boolean;
  provider: string;
  maxSends: number;
  logs: NotificationLog[];
}) {
  return (
    <Card>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>SMS delivery log</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: enabled ? colors.lowBackground : colors.surfaceSecondary },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: enabled ? colors.lowText : colors.textSecondary },
            ]}
          >
            {enabled ? "SMS ENABLED" : "SMS OFF"}
          </Text>
        </View>
      </View>
      <Text style={styles.detail}>
        Provider {provider} · cap {maxSends} sends
      </Text>
      {logs.length === 0 ? (
        <Text style={styles.empty}>No delivery attempts recorded yet.</Text>
      ) : (
        logs.slice(0, 10).map((l) => <SmsLogRow key={l.id} log={l} />)
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  spacer: { flex: 1 },
  level: { ...typography.caption, color: colors.textPrimary, fontWeight: "700" },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  time: { ...typography.caption, color: colors.textTertiary },
  detail: { ...typography.caption, color: colors.textSecondary },
  detail2: { ...typography.caption, color: colors.textTertiary },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  empty: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.sm },
});
