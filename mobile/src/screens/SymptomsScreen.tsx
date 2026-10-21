import DateTimePicker from "@react-native-community/datetimepicker";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBackButton } from "../components/TabBackButton";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Input } from "../components/Input";
import { LoadingState } from "../components/LoadingState";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { MigraineEpisode } from "../types";
import { ApiError } from "../services/api";
import * as symptomService from "../services/symptomService";
import { formatTimestamp } from "../utils/formatting";
import type { MainTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<MainTabParamList, "Symptoms">;

const SYMPTOMS = [
  "Headache",
  "Nausea",
  "Light sensitivity",
  "Sound sensitivity",
  "Aura",
  "Fatigue",
  "Dizziness",
  "Other",
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

const SEVERITIES = [
  { label: "Mild", value: "mild" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
] as const;

type Severity = (typeof SEVERITIES)[number]["value"];

export function SymptomsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [episodes, setEpisodes] = useState<MigraineEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [startTime, setStartTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
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

  useEffect(() => { void Promise.resolve().then(load); }, []);

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
        start_time: startTime.toISOString(),
        severity,
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
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <View style={styles.titleRow}>
        <TabBackButton onPress={() => navigation.navigate("Home")} />
        <Text style={styles.title}>Symptom Logging</Text>
      </View>
      <Text style={styles.sub}>
        Record what you feel. Episodes are the ground truth used to evaluate
        how well the model predicted your risk.
      </Text>

      <Card>
        <Text style={styles.label}>When did it start?</Text>
        <Button
          title={formatTimestamp(startTime.toISOString())}
          variant="secondary"
          onPress={() => setShowPicker(true)}
        />
        {showPicker ? (
          <DateTimePicker
            value={startTime}
            mode="datetime"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, d) => {
              setShowPicker(Platform.OS === "ios");
              if (d) setStartTime(d);
            }}
          />
        ) : null}

        <Text style={styles.label}>Severity</Text>
        <SegmentedControl
          options={SEVERITIES.map((s) => ({ ...s }))}
          value={severity}
          onChange={setSeverity}
        />

        <Text style={styles.label}>Symptoms</Text>
        <View style={styles.chips}>
          {SYMPTOMS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={symptoms.includes(s)}
              onPress={() => toggle(s)}
            />
          ))}
        </View>

        <Text style={styles.label}>Trigger</Text>
        <View style={styles.chips}>
          {TRIGGERS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={trigger === t}
              onPress={() => setTrigger(trigger === t ? "" : t)}
            />
          ))}
        </View>

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Log episode" onPress={() => void submit()} loading={busy} />
      </Card>

      <Text style={styles.section}>Recent episodes ({episodes.length})</Text>
      {episodes.length === 0 ? (
        <EmptyState
          title="No episodes logged yet"
          message="Logged episodes appear here with their severity and symptoms."
        />
      ) : (
        episodes.slice(0, 20).map((e) => (
          <Card key={e.id}>
            <View style={styles.epHead}>
              <Text style={styles.epTime}>
                {formatTimestamp(e.start_time)}
              </Text>
              {e.severity ? (
                <Text style={styles.epSeverity}>{e.severity.toUpperCase()}</Text>
              ) : null}
            </View>
            <Text style={styles.epSymptoms}>{(e.symptoms ?? []).join(", ")}</Text>
            {e.trigger ? (
              <Text style={styles.epMeta}>Trigger: {e.trigger}</Text>
            ) : null}
            {e.notes ? <Text style={styles.epMeta}>Notes: {e.notes}</Text> : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  section: { ...typography.h2, color: colors.textPrimary },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: 6,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  epHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  epTime: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  epSeverity: { ...typography.caption, color: colors.warning, fontWeight: "700" },
  epSymptoms: { ...typography.bodySmall, color: colors.textSecondary },
  epMeta: { ...typography.caption, color: colors.textTertiary },
});
