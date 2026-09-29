import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { MigraineEpisode } from "../types";
import { ApiError } from "../services/api";
import * as symptomService from "../services/symptomService";

const SYMPTOMS = [
  "Headache",
  "Nausea",
  "Light sensitivity",
  "Sound sensitivity",
  "Aura",
  "Fatigue",
];

const TRIGGERS = [
  "Sleep",
  "Stress",
  "Food",
  "Hydration",
  "Environment",
  "Activity",
  "Other",
];

export function SymptomsScreen() {
  const [episodes, setEpisodes] = useState<MigraineEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    symptomService
      .getMigraineHistory()
      .then(setEpisodes)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (s: string) =>
    setSymptoms((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );

  const submit = async () => {
    if (symptoms.length === 0) {
      setError("Select at least one symptom.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await symptomService.logMigraine({
        start_time: new Date().toISOString(),
        severity: "moderate",
        symptoms,
        trigger: trigger || undefined,
        notes: notes || undefined,
      });
      setSymptoms([]);
      setTrigger("");
      setNotes("");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading symptoms…" />;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Symptom Logging</Text>
      <Text style={styles.sub}>Record what you feel. Uses /api/migraine.</Text>
      <View style={styles.chips}>
        {SYMPTOMS.map((s) => (
          <Pressable
            key={s}
            onPress={() => toggle(s)}
            style={[styles.chip, symptoms.includes(s) && styles.chipA]}
          >
            <Text
              style={[styles.chipT, symptoms.includes(s) && styles.chipTA]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Trigger</Text>
      <View style={styles.chips}>
        {TRIGGERS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTrigger(t)}
            style={[styles.chip, trigger === t && styles.chipA]}
          >
            <Text style={[styles.chipT, trigger === t && styles.chipTA]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Save Episode" onPress={submit} loading={busy} />
      <Text style={styles.label}>Recent episodes ({episodes.length})</Text>
      {episodes.slice(0, 10).map((e) => (
        <Text key={e.id} style={styles.row}>
          {e.start_time} — {(e.symptoms ?? []).join(", ")}
        </Text>
      ))}
      {episodes.length === 0 && !error ? (
        <ErrorState message="No episodes logged yet." />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  label: { fontWeight: "700", color: colors.textPrimary, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  chipA: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipT: { color: colors.textSecondary },
  chipTA: { color: colors.primaryDark, fontWeight: "600" },
  error: { color: colors.error },
  row: { color: colors.textSecondary, fontSize: 13 },
});
