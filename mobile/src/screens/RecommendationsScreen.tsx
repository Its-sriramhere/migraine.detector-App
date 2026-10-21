import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Brain,
  Coffee,
  Droplets,
  Heart,
  Sparkles,
  Video,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { LoadingState } from "../components/LoadingState";
import { RecommendationCard } from "../components/RecommendationCard";
import { StatusCard } from "../components/StatusCard";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useRisk } from "../hooks/useRisk";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Recommendations">;

/** Generic wellness tips — used only when the model returns no advice. */
const GENERAL_TIPS = [
  {
    icon: <Video size={20} color={colors.primary} />,
    title: "Prioritize your sleep",
    body: "Aim for 7–9 hours tonight.",
  },
  {
    icon: <Droplets size={20} color={colors.primary} />,
    title: "Stay hydrated",
    body: "Drink water regularly throughout the day.",
  },
  {
    icon: <Brain size={20} color={colors.primary} />,
    title: "Manage stress",
    body: "Try a short guided breathing session.",
  },
  {
    icon: <Coffee size={20} color={colors.primary} />,
    title: "Reduce known triggers",
    body: "Limit bright screens if they affect you.",
  },
  {
    icon: <Heart size={20} color={colors.primary} />,
    title: "Follow your care plan",
    body: "Use prescribed medicine only as directed.",
  },
];

export function RecommendationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { prediction, loading } = useRisk(true);

  const advice = prediction?.advice ?? [];
  const fromModel = advice.length > 0;

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <AppHeader
        title="Recommendations"
        subtitle="Based on recent wearable signals"
        layout="left"
        titleStyle={styles.title}
        onBack={() => navigation.goBack()}
      />

      {loading && !prediction ? (
        <LoadingState message="Loading recommendations…" />
      ) : (
        <>
          <Card style={styles.hero}>
            <IconCircle size={48} background={colors.moderateBackground} color={colors.moderate}>
              <Sparkles size={20} color={colors.moderate} />
            </IconCircle>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>
                {fromModel ? "Today's self-care plan" : "General self-care plan"}
              </Text>
              <Text style={styles.heroSub}>
                {fromModel
                  ? "Support a healthy routine and recovery"
                  : "Support a healthy routine — no model signals yet"}
              </Text>
            </View>
          </Card>

          {fromModel
            ? advice.map((tip, i) => (
                <RecommendationCard
                  key={`${tip}-${i}`}
                  icon={<Sparkles size={20} color={colors.primary} />}
                  title={tip}
                />
              ))
            : GENERAL_TIPS.map((tip) => (
                <RecommendationCard key={tip.title} {...tip} />
              ))}

          <StatusCard
            icon={<Sparkles size={18} color={colors.low} />}
            title="Keep up the good routine"
            body="These tips support wellness and do not replace individualized medical advice."
            background={colors.lowPale}
            iconBackground={colors.lowBackground}
            iconColor={colors.low}
            titleColor={colors.lowDark}
          />

          {user ? (
            <Text style={styles.note}>
              Generated for {user.email} · research prototype, not a medical device.
            </Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.moderatePale,
    borderColor: colors.moderateBackground,
    borderRadius: radius.card,
  },
  heroText: { flex: 1, gap: 1 },
  title: { ...typography.title, color: colors.textPrimary },
  heroTitle: { ...typography.section, color: colors.textPrimary },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
