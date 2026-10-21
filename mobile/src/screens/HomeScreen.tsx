import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowUpRight,
  Check,
  Droplets,
  HeartPulse,
  Moon,
  Wind,
} from "lucide-react-native";
import { IconCircle } from "../components/IconCircle";
import { AmbientBackground } from "../components/AmbientBackground";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { RiskSummaryCard } from "../components/RiskSummaryCard";
import { EmptyState, ErrorState, OfflineBanner } from "../components/States";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useNetwork } from "../hooks/useNetwork";
import { useSensorData } from "../hooks/useSensorData";
import type { BaselineEstimates } from "../types";
import * as userService from "../services/userService";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/types";
import { greetingFor } from "../utils/date";
import { formatSleep, riskSentence, timeAgo } from "../utils/formatting";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const online = useNetwork();
  const [baseline, setBaseline] = useState<BaselineEstimates | null>(null);
  const {
    mode,
    prediction,
    latestReading,
    loading,
    error,
    lastSync,
    refresh,
  } = useSensorData(user?.id ?? null, "live");

  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    userService.getBaseline().then(setBaseline).catch(() => undefined);
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const level = prediction?.risk_level ?? "low";
  const score = prediction?.risk_score ?? 0;

  return (
    <Animated.View style={[styles.wrap, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.base },
        ]}
      >
      <AmbientBackground />
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.greeting}>{greetingFor()},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <IconCircle size={42} background={colors.lowBackground} color={colors.low}>
          <Check size={18} color={colors.low} strokeWidth={3} />
        </IconCircle>
      </View>

      {online === false ? <OfflineBanner lastSync={lastSync} /> : null}

      {loading && !prediction ? (
        <LoadingState message="Loading monitoring data…" />
      ) : error && !prediction ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : prediction ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Prediction")}
        >
          <RiskSummaryCard
            icon={<Check size={20} color={colors.low} strokeWidth={3} />}
            level={level}
            sentence={riskSentence(level, score)}
          />
        </Pressable>
      ) : (
        <EmptyState
          title="No monitoring data yet"
          message="Pair your wearable to start seeing your predicted risk here."
        />
      )}

      <Text style={styles.section}>{"Today's Health"}</Text>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <MetricCard
            icon={<Moon size={15} color={colors.lavenderStrong} />}
            iconBackground={colors.lavender}
            iconColor={colors.lavenderStrong}
            label="Sleep"
            value={formatSleep(
              baseline?.sleep_hours != null
                ? baseline.sleep_hours * 60
                : undefined,
            )}
            sublabel={
              baseline?.sleep_hours ? (baseline.sleep_hours >= 7 && baseline.sleep_hours <= 9 ? "Within sleep goal" : "Outside sleep goal") : "Set your baseline"
            }
            sublabelColor={
              baseline?.sleep_hours ? colors.lowDark : colors.textTertiary
            }
          />
        </View>
        <View style={styles.cell}>
          <MetricCard
            icon={<HeartPulse size={15} color={colors.high} />}
            iconBackground={colors.pinkTint}
            iconColor={colors.high}
            label="HRV"
            value={
              latestReading?.hrv != null
                ? `${Math.round(latestReading.hrv)} ms`
                : "—"
            }
            sublabel={latestReading?.hrv != null ? "Latest measurement" : "Waiting for readings"}
            sublabelColor={colors.textSecondary}
          />
        </View>
        <View style={styles.cell}>
          <MetricCard
            icon={<ArrowUpRight size={15} color={colors.primary} />}
            iconBackground={colors.blueTint}
            iconColor={colors.primary}
            label="Blood Pressure"
            value={
              latestReading?.systolic_bp && latestReading?.diastolic_bp
                ? `${latestReading.systolic_bp}/${latestReading.diastolic_bp}`
                : "—"
            }
            sublabel="mmHg"
            sublabelColor={colors.textSecondary}
          />
        </View>
        <View style={styles.cell}>
          <MetricCard
            icon={<Droplets size={15} color={colors.accent} />}
            iconBackground={colors.accentPale}
            iconColor={colors.accent}
            label="SpO₂"
            value={
              latestReading?.spo2 != null
                ? `${Math.round(latestReading.spo2)}%`
                : "—"
            }
            sublabel={latestReading?.spo2 != null ? "Latest measurement" : "Waiting for readings"}
            sublabelColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.trend}>
        <IconCircle size={40} background={colors.blueTint} color={colors.primary}>
          <Wind size={18} color={colors.primary} />
        </IconCircle>
        <View style={styles.trendText}>
          <Text style={styles.trendTitle}>Your Trend</Text>
          <Text style={styles.trendBody}>
            {prediction
              ? `Health signals have been ${level === "low" ? "stable" : "shifting"}.`
              : "Connect your wearable to begin tracking trends."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Trends")}
            style={styles.trendLink}
          >
            <Text style={styles.trendLinkText}>View analytics →</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Alerts")}
            style={styles.trendLink}
          >
            <Text style={styles.trendLinkText}>Insights & alerts →</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footnote}>
        {prediction
          ? `Updated ${timeAgo(prediction.timestamp)} · research prototype, not a medical device.`
          : "Research prototype, not a medical device."}
        {mode === "demo" ? " · DEMO DATA" : ""}
      </Text>
    </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  head: { flexDirection: "row", alignItems: "center" },
  headText: { flex: 1 },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.greeting, color: colors.textPrimary },
  section: { ...typography.section, color: colors.textPrimary, marginTop: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cell: { flexBasis: "47%", flexGrow: 1, minWidth: 150 },
  trend: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
  },
  trendText: { flex: 1, gap: 2 },
  trendTitle: { ...typography.rowTitle, color: colors.textPrimary },
  trendBody: { ...typography.caption, color: colors.textSecondary },
  trendLink: { marginTop: 2, minHeight: 24, justifyContent: "center" },
  trendLinkText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  footnote: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
