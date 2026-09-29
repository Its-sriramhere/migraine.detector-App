import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, riskColors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { formatRiskScore, timeAgo } from "../utils/formatting";
import { Card } from "./Card";

interface Props {
  score: number;
  level: string;
  timestamp?: string;
  onPress?: () => void;
}

/** Most important dashboard component. Never implies diagnostic certainty. */
export function RiskCard({ score, level, timestamp, onPress }: Props) {
  const rc = riskColors(level);
  return (
    <Card>
      <Text style={styles.title}>Predicted Migraine Risk</Text>
      <View style={[styles.badge, { backgroundColor: rc.background }]}>
        <Text style={[styles.score, { color: rc.text }]}>
          {formatRiskScore(score)}
        </Text>
        <Text style={[styles.level, { color: rc.text }]}>
          {level.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.sub}>
        {timestamp
          ? `Based on measurements ${timeAgo(timestamp)}`
          : "Based on latest measurements"}
      </Text>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.link}
        >
          <Text style={styles.linkText}>View Explanation</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: 8 },
  badge: {
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: "center",
    gap: 2,
  },
  score: { fontSize: 40, fontWeight: "700" },
  level: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  sub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  link: {
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
