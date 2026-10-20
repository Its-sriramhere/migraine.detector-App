import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Moon, HeartPulse, Droplets, Activity } from "lucide-react-native";
import { IconCircle } from "../components/IconCircle";
import { PrimaryButton } from "../components/PrimaryButton";
import { WatchMock } from "../components/WatchMock";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const PAGES = [
  {
    eyebrow: "WELCOME TO",
    title: "A clearer day starts here",
    headline: "Wear. Track. Predict.",
    body: "We monitor your sleep, HRV, blood pressure and SpO₂ to spot changes before migraines.",
  },
  {
    eyebrow: "HOW IT WORKS",
    title: "Signals become predictions",
    headline: "Track. Understand. Act.",
    body: "Your wearable streams signals to the app, and the model explains what changed.",
  },
  {
    eyebrow: "GETTING STARTED",
    title: "Build your personal baseline",
    headline: "Know your normal.",
    body: "A short health assessment lets the model compare every reading against your own normal range.",
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const page = PAGES[index];
  const last = index === PAGES.length - 1;

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{page.eyebrow}</Text>
        <Text style={styles.title}>{page.title}</Text>

        <View style={styles.art}>
          <WatchMock width={150} label="HEALTH MONITOR" />
          <IconCircle size={54} background={colors.pinkTint} color={colors.high}>
            <HeartPulse size={20} color={colors.high} />
          </IconCircle>
          <IconCircle size={48} background={colors.lavender} color={colors.lavenderStrong}>
            <Moon size={18} color={colors.lavenderStrong} />
          </IconCircle>
          <IconCircle size={48} background={colors.mintTint} color={colors.lowDark}>
            <Droplets size={18} color={colors.lowDark} />
          </IconCircle>
          <IconCircle size={48} background={colors.blueTint} color={colors.primary}>
            <Activity size={18} color={colors.primary} />
          </IconCircle>
        </View>

        <Text style={styles.headline}>{page.headline}</Text>
        <Text style={styles.body}>{page.body}</Text>

        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.eyebrow} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PrimaryButton
          title={last ? "Get Started" : "Continue"}
          onPress={() =>
            last
              ? navigation.navigate("Assessment")
              : setIndex((i) => Math.min(PAGES.length - 1, i + 1))
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  eyebrow: {
    ...typography.microStrong,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  title: { ...typography.section, color: colors.textPrimary, textAlign: "center" },
  art: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl },
  headline: { ...typography.title, color: colors.textPrimary, textAlign: "center" },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentSoft },
  dotActive: { backgroundColor: colors.primary },
  footer: { paddingHorizontal: spacing.xl },
});
