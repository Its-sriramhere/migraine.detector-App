import Slider from "@react-native-community/slider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { AdviceList } from "../components/AdviceList";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { DemoBanner } from "../components/DemoBanner";
import { RiskBadge } from "../components/RiskBadge";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { Prediction, ScenarioName } from "../types";
import { ApiError } from "../services/api";
import * as sensorService from "../services/sensorService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Demo">;

interface SliderDef {
  key: keyof sensorService.DemoSignal;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit: string;
  scale?: number;
}

const SLIDERS: SliderDef[] = [
  { key: "heart_rate", label: "Heart rate", min: 50, max: 140, unit: "BPM" },
  { key: "hrv", label: "HRV", min: 10, max: 80, unit: "ms" },
  { key: "systolic_bp", label: "Systolic BP", min: 90, max: 165, unit: "mmHg" },
  { key: "diastolic_bp", label: "Diastolic BP", min: 55, max: 110, unit: "mmHg" },
  { key: "spo2", label: "SpO₂", min: 90, max: 100, unit: "%" },
  {
    key: "temperature",
    label: "Temperature",
    min: 35.5,
    max: 38.5,
    step: 0.1,
    unit: "°C",
  },
  {
    key: "activity",
    label: "Activity",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "g",
    scale: 100,
  },
];

const PRESETS: { name: ScenarioName; label: string; note: string }[] = [
  { name: "normal", label: "NORMAL", note: "Baseline physiological values" },
  { name: "moderate", label: "MODERATE", note: "Deviating signals, elevated risk" },
  { name: "high", label: "HIGH RISK", note: "Strong deviation, high risk" },
];

export function DemoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<Record<string, number>>({
    heart_rate: 72,
    hrv: 45,
    systolic_bp: 118,
    diastolic_bp: 76,
    spo2: 98,
    temperature: 36.6,
    activity: 0.15,
  });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [scenario, setScenario] = useState<ScenarioName>("normal");
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sensorService
      .getDemoStatus()
      .then((s) => setStreaming(s.running))
      .catch(() => undefined);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const push = useCallback(
    async (signal: sensorService.DemoSignal) => {
      try {
        const res = await sensorService.sendDemoSensor(signal);
        setPrediction(res.prediction);
        setCount((c) => c + 1);
        setError(null);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Unable to send reading.");
      }
    },
    [],
  );

  const onSlider = (key: string, value: number) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void push({ [key]: value } as sensorService.DemoSignal);
    }, 500);
  };

  const applyPreset = async (name: ScenarioName) => {
    setScenario(name);
    setBusy(true);
    try {
      const res = await sensorService.sendScenario(name);
      setPrediction(res.prediction);
      setCount((c) => c + 1);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to run preset.");
    } finally {
      setBusy(false);
    }
  };

  const startStream = async () => {
    setBusy(true);
    try {
      const signal: sensorService.DemoSignal = {
        heart_rate: values.heart_rate,
        hrv: values.hrv,
        systolic_bp: values.systolic_bp,
        diastolic_bp: values.diastolic_bp,
        spo2: values.spo2,
        temperature: values.temperature,
        activity: values.activity,
      };
      await sensorService.startDemo(scenario);
      await push(signal);
      setStreaming(true);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to start the stream.");
    } finally {
      setBusy(false);
    }
  };

  const stopStream = async () => {
    try {
      await sensorService.stopDemo();
      setStreaming(false);
    } catch {
      setStreaming(false);
    }
  };

  const topFeatures = prediction
    ? [...(prediction.features ?? [])]
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .slice(0, 3)
    : [];

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <AppHeader title="Demo Lab" layout="left" titleStyle={styles.title} onBack={() => navigation.goBack()} />
      <Text style={styles.sub}>
        Presets and custom readings run through the same pipeline as a paired
        wearable: preprocessing → features → model → explanation → risk.
      </Text>
      <DemoBanner />

      <Text style={styles.section}>Pipeline presets</Text>
      <View style={styles.chips}>
        {PRESETS.map((p) => (
          <Chip
            key={p.name}
            label={p.label}
            selected={scenario === p.name}
            onPress={() => void applyPreset(p.name)}
          />
        ))}
      </View>
      <Text style={styles.note}>
        {PRESETS.find((p) => p.name === scenario)?.note}
      </Text>

      <View style={styles.streamRow}>
        <Button
          title={streaming ? "Stop stream" : "Start simulated stream"}
          variant={streaming ? "secondary" : "primary"}
          onPress={() => (streaming ? void stopStream() : void startStream())}
          loading={busy}
        />
        {streaming ? (
          <View style={styles.streamingBadge}>
            <Text style={styles.streamingText}>● STREAMING {scenario}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.section}>Live insight — why this risk</Text>
      <Card>
        {prediction ? (
          <>
            <View style={styles.insightHead}>
              <Text style={styles.insightScore}>
                {Math.round(prediction.risk_score)}%
              </Text>
              <RiskBadge level={prediction.risk_level} />
            </View>
            {topFeatures.map((f) => (
              <View key={f.id ?? f.feature_name} style={styles.featureRow}>
                <Text style={styles.featureName}>{f.feature_name}</Text>
                <Text
                  style={[
                    styles.featureValue,
                    {
                      color:
                        f.contribution >= 0 ? colors.highText : colors.lowText,
                    },
                  ]}
                >
                  {f.contribution >= 0 ? "+" : ""}
                  {f.contribution.toFixed(1)}
                </Text>
              </View>
            ))}
            <AdviceList advice={prediction.advice} title="Calming steps" />
          </>
        ) : (
          <Text style={styles.note}>
            No prediction yet — sample a preset to see the explanation.
          </Text>
        )}
        <Text style={styles.count}>{count} readings sent in this session</Text>
      </Card>

      <Text style={styles.section}>Custom reading</Text>
      <Card>
        {SLIDERS.map((s) => {
          const raw = values[s.key] ?? s.min;
          const shown = s.scale ? Math.round(raw * s.scale) : raw;
          return (
            <View key={s.key} style={styles.sliderBlock}>
              <View style={styles.sliderHead}>
                <Text style={styles.sliderLabel}>{s.label}</Text>
                <Text style={styles.sliderValue}>
                  {shown} {s.unit}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={s.min}
                maximumValue={s.max}
                step={s.step}
                value={raw}
                onValueChange={(v) => onSlider(s.key, v)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                accessibilityLabel={s.label}
              />
            </View>
          );
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Send reading"
          variant="secondary"
          onPress={() =>
            void push({
              heart_rate: values.heart_rate,
              hrv: values.hrv,
              systolic_bp: values.systolic_bp,
              diastolic_bp: values.diastolic_bp,
              spo2: values.spo2,
              temperature: values.temperature,
              activity: values.activity,
            })
          }
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  section: { ...typography.h2, color: colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  note: { ...typography.caption, color: colors.textTertiary },
  streamRow: { gap: spacing.sm },
  streamingBadge: { alignSelf: "flex-start" },
  streamingText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "700",
  },
  insightHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  insightScore: { fontSize: 30, fontWeight: "700", color: colors.textPrimary },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  featureName: { ...typography.bodySmall, color: colors.textSecondary },
  featureValue: { ...typography.bodySmall, fontWeight: "700" },
  count: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  sliderBlock: { marginBottom: spacing.sm },
  sliderHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sliderLabel: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  sliderValue: { ...typography.caption, color: colors.textSecondary },
  slider: { width: "100%", height: 40 },
  error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
});
