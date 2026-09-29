import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";
import type { AssessmentAnswer, AssessmentQuestion } from "../types";
import { ApiError } from "../services/api";
import * as userService from "../services/userService";

type Props = NativeStackScreenProps<RootStackParamList, "Assessment">;

const SECTIONS = [
  "Personal Information",
  "Sleep",
  "Stress",
  "Lifestyle",
  "Migraine History",
];

export function AssessmentScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    userService
      .getQuestions()
      .then(setQuestions)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load."),
      )
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    const payload: AssessmentAnswer[] = questions
      .filter((q) => answers[q.id])
      .map((q) => ({ question_id: q.id, answer: answers[q.id] }));
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
      setError(
        e instanceof ApiError ? e.message : "Unable to submit. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading assessment…" />;
  if (error && questions.length === 0)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          userService
            .getQuestions()
            .then(setQuestions)
            .catch(() => {})
            .finally(() => setLoading(false));
        }}
      />
    );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Health Assessment</Text>
      <Text style={styles.step}>
        Step 1 of {SECTIONS.length} — answer to build your baseline
      </Text>
      {SECTIONS.map((s) => (
        <Text key={s} style={styles.section}>
          {s}
        </Text>
      ))}
      {questions.map((q) => (
        <View key={q.id} style={styles.q}>
          <Text style={styles.qText}>{q.question_text}</Text>
          <View style={styles.opts}>
            {q.options.map((o) => {
              const active = answers[q.id] === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                  style={[styles.opt, active && styles.optActive]}
                >
                  <Text
                    style={[styles.optText, active && styles.optTextActive]}
                  >
                    {o}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Continue" onPress={submit} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  step: { color: colors.textSecondary },
  section: {
    fontWeight: "700",
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  q: { marginTop: spacing.sm },
  qText: { fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  opts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  optActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  optText: { color: colors.textSecondary },
  optTextActive: { color: colors.primaryDark, fontWeight: "600" },
  error: { color: colors.error },
});
