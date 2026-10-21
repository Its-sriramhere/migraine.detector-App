import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProgressBar } from "../components/ProgressBar";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useSectionEntrance } from "../hooks/useSectionEntrance";
import type { AssessmentQuestion } from "../types";
import { ApiError } from "../services/api";
import * as userService from "../services/userService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Assessment">;

const SECTIONS = [
  {
    key: "personal",
    title: "Personal information",
    match: ["resting heart-rate", "blood pressure"],
  },
  {
    key: "sleep",
    title: "Sleep",
    match: ["sleep"],
  },
  {
    key: "stress",
    title: "Stress",
    match: ["stress"],
  },
  {
    key: "lifestyle",
    title: "Lifestyle",
    match: ["physically active", "caffeine", "hydration"],
  },
  {
    key: "history",
    title: "Migraine history",
    match: [
      "migraine or headache episodes before",
      "typically experience migraine",
      "typical episode last",
      "symptoms usually occur",
      "associated with your headaches",
      "consistent pattern before",
    ],
  },
] as const;

function sectionIndex(q: AssessmentQuestion): number {
  const text = q.question_text.toLowerCase();
  const idx = SECTIONS.findIndex((s) =>
    s.match.some((m) => text.includes(m)),
  );
  return idx === -1 ? SECTIONS.length - 1 : idx;
}

export function AssessmentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const entrance = useSectionEntrance(5, !loading);

  useEffect(() => {
    userService
      .getQuestions()
      .then(setQuestions)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load."),
      )
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const groups: AssessmentQuestion[][] = SECTIONS.map(() => []);
    questions.forEach((q) => groups[sectionIndex(q)].push(q));
    return groups;
  }, [questions]);

  const current = grouped[step] ?? [];
  const answered = current.filter((q) => (answers[q.id] ?? []).length > 0).length;
  const complete = current.length > 0 && answered === current.length;

  const toggle = (q: AssessmentQuestion, option: string) => {
    setAnswers((cur) => {
      const existing = cur[q.id] ?? [];
      if (q.question_type === "multi") {
        return {
          ...cur,
          [q.id]: existing.includes(option)
            ? existing.filter((o) => o !== option)
            : [...existing, option],
        };
      }
      return { ...cur, [q.id]: [option] };
    });
  };

  const submit = async () => {
    const payload = questions
      .filter((q) => (answers[q.id] ?? []).length > 0)
      .map((q) => ({ question_id: q.id, answer: answers[q.id].join(", ") }));
    if (payload.length === 0) {
      setError("Answer at least one question to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await userService.submitAssessment(payload);
      navigation.navigate("Main");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to submit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading assessment…" />;
  if (error && questions.length === 0)
    return <ErrorState message={error} onRetry={() => setLoading(true)} />;

  const isLast = step === SECTIONS.length - 1;

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <Animated.View style={entrance(0)}>
        <AppHeader
          title="Health Assessment"
          layout="left"
          titleStyle={styles.title}
          onBack={() => navigation.goBack()}
        />
      </Animated.View>
      <Animated.View style={entrance(1)}>
        <Text style={styles.step}>
          Step {step + 1} of {SECTIONS.length} — {SECTIONS[step].title}
        </Text>
      </Animated.View>
      <Animated.View style={entrance(2)}>
        <ProgressBar
          value={step + 1}
          total={SECTIONS.length}
          label={`${answered} of ${current.length} answered in this step`}
        />
      </Animated.View>

      <Animated.View style={[styles.questionList, entrance(3)]}>
        {current.map((q) => (
          <Card key={q.id} style={styles.questionCard}>
            <Text style={styles.eyebrow}>
              {q.question_type === "multi" ? "SELECT ALL THAT APPLY" : "SELECT ONE"}
            </Text>
            <Text style={styles.question}>{q.question_text}</Text>
            <View style={styles.options}>
              {q.options.map((o) => {
                const active = (answers[q.id] ?? []).includes(o);
                return (
                  <Pressable
                    key={o}
                    accessibilityRole={
                      q.question_type === "multi" ? "checkbox" : "radio"
                    }
                    accessibilityState={{ checked: active }}
                    onPress={() => toggle(q, o)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text
                      style={[styles.optionText, active && styles.optionTextActive]}
                    >
                      {active ? "✓ " : ""}
                      {o}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        ))}
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Animated.View style={entrance(4)}>
        <View style={styles.actions}>
          <PrimaryButton
            title="Back"
            variant="secondary"
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            style={styles.action}
          />
          <PrimaryButton
            title={isLast ? "Build My Profile" : "Continue"}
            onPress={() => (isLast ? void submit() : setStep((s) => s + 1))}
            loading={busy}
            disabled={!complete}
            style={styles.action}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base, flexGrow: 1 },
  title: { ...typography.title, color: colors.textPrimary },
  step: { ...typography.bodySmall, color: colors.textSecondary },
  questionList: { gap: spacing.base },
  questionCard: { gap: 4 },
  eyebrow: {
    ...typography.microStrong,
    color: colors.textTertiary,
    letterSpacing: 0.6,
  },
  question: { ...typography.rowTitle, color: colors.textPrimary },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.base,
    minHeight: 48,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionText: { ...typography.body, color: colors.textSecondary },
  optionTextActive: { color: colors.primaryDark, fontWeight: "600" },
  error: { ...typography.bodySmall, color: colors.error },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
