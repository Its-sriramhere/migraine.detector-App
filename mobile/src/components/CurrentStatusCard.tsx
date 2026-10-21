import { Pressable, StyleSheet, Text, View } from "react-native";
import { Sparkles, Target, TrendingUp } from "lucide-react-native";
import { colors, themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { AssessmentStatus } from "../types";
import { IconCircle } from "./IconCircle";

interface Props {
  status: AssessmentStatus;
  /** Opens Mira with the status as the topic. */
  onAskMira?: () => void;
}

/**
 * "Your current status" card.
 *
 * Shows what the assessment says about the person right now, what to focus
 * on, and one low-risk action to try. There is deliberately no risk score
 * or band here: the risk bands are calibrated against sensor readings, not
 * questionnaire answers, so a band from the assessment alone would mislead.
 */
export function CurrentStatusCard({ status, onAskMira }: Props) {
  const focus = status.focus_areas ?? [];
  const strengths = status.strengths ?? [];
  const tips = status.tips ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <IconCircle size={40} background={colors.blueTint} color={colors.primary}>
          <Target size={19} color={colors.primary} strokeWidth={2.2} />
        </IconCircle>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>YOUR CURRENT STATUS</Text>
          <Text style={styles.headline}>{status.headline}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{status.summary}</Text>

      {focus.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.blockTitle}>
            <Target size={13} color={colors.textSecondary} strokeWidth={2.4} />
            <Text style={styles.blockHeading}>Worth attention</Text>
          </View>
          {focus.map((item) => (
            <View key={item.area} style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.area}</Text>
                <Text style={styles.rowBody}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {strengths.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.blockTitle}>
            <TrendingUp size={13} color={colors.low} strokeWidth={2.4} />
            <Text style={styles.blockHeading}>Looking good</Text>
          </View>
          {strengths.map((item) => (
            <View key={item.area} style={styles.row}>
              <View style={[styles.dot, styles.dotGood]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.area}</Text>
                <Text style={styles.rowBody}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tips.length > 0 ? (
        <View style={styles.tip}>
          <Text style={styles.tipLabel}>TRY THIS</Text>
          <Text style={styles.tipTitle}>{tips[0].title}</Text>
          <Text style={styles.tipBody}>{tips[0].body}</Text>
        </View>
      ) : null}

      {onAskMira ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAskMira}
          style={({ pressed }) => [styles.ask, pressed && styles.askPressed]}
        >
          <Sparkles size={15} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.askText}>Ask Mira about this</Text>
        </Pressable>
      ) : null}

      {status.baseline_note ? (
        <Text style={styles.baseline}>{status.baseline_note}</Text>
      ) : null}
      <Text style={styles.source}>{status.source_note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: themeNew.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    gap: spacing.md,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  headText: { flex: 1, gap: 2 },
  eyebrow: {
    ...typography.micro,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.textSecondary,
  },
  headline: { ...typography.h3, color: colors.textPrimary },
  summary: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 21 },
  block: { gap: spacing.sm },
  blockTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  blockHeading: {
    ...typography.micro,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: colors.primary,
  },
  dotGood: { backgroundColor: colors.low },
  rowText: { flex: 1, gap: 1 },
  rowTitle: { ...typography.bodySmall, fontWeight: "600", color: colors.textPrimary },
  rowBody: { ...typography.micro, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  tip: {
    backgroundColor: colors.primaryLight ?? colors.blueTint,
    borderRadius: radius.md ?? 12,
    padding: spacing.md,
    gap: 3,
  },
  tipLabel: {
    ...typography.micro,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
  },
  tipTitle: { ...typography.bodySmall, fontWeight: "600", color: colors.textPrimary },
  tipBody: { ...typography.micro, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  ask: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: radius.md ?? 12,
    paddingVertical: spacing.sm + 2,
  },
  askPressed: { opacity: 0.9 },
  askText: { ...typography.bodySmall, fontWeight: "600", color: "#FFFFFF" },
  baseline: { ...typography.micro, fontSize: 11, color: colors.textSecondary },
  source: { ...typography.micro, fontSize: 10, color: colors.textSecondary },
});
