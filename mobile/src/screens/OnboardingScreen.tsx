import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppLogo } from "../components/AppLogo";
import { OnboardingArt } from "../components/OnboardingArt";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";
import { markOnboardingSeen } from "../services/onboardingService";
import * as userService from "../services/userService";

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

  const finish = async () => {
    await markOnboardingSeen();

    // Users who already have a risk profile have completed the assessment
    // before, so onboarding can hand them straight to the app.
    let hasProfile = true;
    try {
      await userService.getRiskProfile();
    } catch {
      hasProfile = false;
    }

    navigation.replace(hasProfile ? "Main" : "Assessment");
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <AppLogo size={44} />
        </View>

        <Text style={styles.eyebrow}>{page.eyebrow}</Text>
        <Text style={styles.title}>{page.title}</Text>

        <View style={styles.artWrap}>
          <OnboardingArt />
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
          onPress={() => {
            if (last) {
              void finish();
            } else {
              setIndex((i) => Math.min(PAGES.length - 1, i + 1));
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  brand: { alignItems: "center", marginBottom: spacing.md },
  eyebrow: {
    ...typography.microStrong,
    fontSize: 12,
    lineHeight: 15,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  title: {
    ...typography.rowTitle,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  artWrap: { alignItems: "center", marginTop: spacing.lg },
  headline: {
    ...typography.title,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: "center",
  },
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
