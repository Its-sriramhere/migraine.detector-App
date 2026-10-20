import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { EpisodeFrequencyChart } from "../components/EpisodeFrequencyChart";
import { LoadingState } from "../components/LoadingState";
import { MiraHost } from "../components/MiraHost";
import { SectionHeader } from "../components/SectionHeader";
import { ErrorState } from "../components/States";
import { themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { MigraineEpisode } from "../types";
import { getMigraineHistory } from "../services/symptomService";
import { navigateToGuideRoute } from "../utils/miraRoutes";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

/** Pain score out of ten for each stored severity level. */
const PAIN: Record<string, number> = { mild: 3, moderate: 6, severe: 8 };
/** Severity rank used for the average figure. */
const RANK: Record<string, number> = { mild: 1, moderate: 2, severe: 3 };

/** Date chips cycle through the three Figma accent tints. */
const CHIP_TINTS = [
  { bg: themeNew.purpleTint, fg: themeNew.purple },
  { bg: themeNew.blueTint, fg: themeNew.primary },
  { bg: themeNew.mintTint, fg: themeNew.levelLow },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function durationLabel(episode: MigraineEpisode) {
  if (!episode.end_time) return "Ongoing";
  const start = new Date(episode.start_time).getTime();
  const end = new Date(episode.end_time).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "Logged";
  }
  const minutes = Math.round((end - start) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function titleFor(episode: MigraineEpisode) {
  const severity = (episode.severity ?? "").toLowerCase();
  if (severity === "severe") return "Severe migraine";
  if (severity === "moderate") return "Moderate migraine";
  if (severity === "mild") return "Mild migraine";
  return "Headache logged";
}

export function HistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [episodes, setEpisodes] = useState<MigraineEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEpisodes(await getMigraineHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inMonth = useMemo(
    () =>
      episodes.filter((ep) => {
        const d = new Date(ep.start_time);
        return Number.isFinite(d.getTime()) && sameMonth(d, month);
      }),
    [episodes, month],
  );

  const previousMonth = useMemo(() => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    return startOfMonth(d);
  }, [month]);

  const previousCount = useMemo(
    () =>
      episodes.filter((ep) => {
        const d = new Date(ep.start_time);
        return (
          Number.isFinite(d.getTime()) && sameMonth(d, previousMonth)
        );
      }).length,
    [episodes, previousMonth],
  );

  const episodeDays = useMemo(
    () =>
      new Set(
        inMonth.map((ep) => new Date(ep.start_time).toDateString()),
      ).size,
    [inMonth],
  );

  const avgSeverity = useMemo(() => {
    if (inMonth.length === 0) return null;
    const total = inMonth.reduce(
      (sum, ep) => sum + (RANK[(ep.severity ?? "").toLowerCase()] ?? 1),
      0,
    );
    return total / inMonth.length;
  }, [inMonth]);

  const change = useMemo(() => {
    if (previousCount === 0) return null;
    return Math.round(((inMonth.length - previousCount) / previousCount) * 100);
  }, [inMonth.length, previousCount]);

  // Last seven days of the selected month (up to today for the current one).
  const days = useMemo(() => {
    const today = new Date();
    const lastDay = sameMonth(month, today)
      ? today.getDate()
      : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    const start = Math.max(1, lastDay - 6);
    const result = [];
    for (let day = start; day <= lastDay; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const count = inMonth.filter((ep) => {
        const d = new Date(ep.start_time);
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
        );
      }).length;
      result.push({ label: WEEKDAYS[date.getDay()], count });
    }
    return result;
  }, [inMonth, month]);

  const recent = useMemo(
    () =>
      inMonth
        .slice()
        .sort(
          (a, b) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
        )
        .slice(0, 3),
    [inMonth],
  );

  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + delta);
    setMonth(startOfMonth(d));
  };

  return (
    <>
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.base },
        ]}
      >
      <SectionHeader
        title="Migraine History"
        subtitle="See episodes, symptoms and patterns"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          style={styles.monthArrow}
        >
          <ChevronLeft size={20} color={themeNew.primary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => shiftMonth(1)}
          style={styles.monthArrow}
        >
          <ChevronRight size={20} color={themeNew.primary} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: themeNew.purple }]}>
            {String(episodeDays).padStart(2, "0")}
          </Text>
          <Text style={styles.statLabel}>Episode days</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: themeNew.primary }]}>
            {avgSeverity !== null ? avgSeverity.toFixed(1) : "—"}
          </Text>
          <Text style={styles.statLabel}>Avg. severity</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: themeNew.levelLow }]}>
            {change !== null ? `${change > 0 ? "+" : ""}${change}%` : "—"}
          </Text>
          <Text style={styles.statLabel}>vs last month</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text style={styles.cardTitle}>Episode frequency</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>LAST 7D</Text>
          </View>
        </View>
        {loading ? (
          <LoadingState message="Loading episodes…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <EpisodeFrequencyChart days={days} />
        )}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>RECENT EPISODES</Text>
        <Text style={styles.viewAll}>View all →</Text>
      </View>

      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No episodes logged for {monthLabel} yet.
          </Text>
        </View>
      ) : (
        recent.map((ep, index) => {
          const tint = CHIP_TINTS[index % CHIP_TINTS.length];
          const severity = (ep.severity ?? "").toLowerCase();
          const pain = PAIN[severity] ?? 2;
          return (
            <Pressable
              key={ep.id}
              accessibilityRole="button"
              style={styles.episode}
            >
              <View style={[styles.episodeChip, { backgroundColor: tint.bg }]}>
                <Text style={[styles.episodeChipText, { color: tint.fg }]}>
                  {new Date(ep.start_time)
                    .toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.episodeText}>
                <Text style={styles.episodeTitle}>{titleFor(ep)}</Text>
                <Text style={styles.episodeSub}>
                  Pain {pain}/10 · {durationLabel(ep)}
                </Text>
              </View>
              <ChevronRight size={18} color={themeNew.textSecondary} />
            </Pressable>
          );
        })
      )}
      </ScrollView>

      <MiraHost
        onNavigate={(route) => navigateToGuideRoute(navigation, route, true)}
        bottom={24}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: themeNew.background },
  content: { padding: spacing.base, gap: spacing.md, paddingBottom: 120 },
  title: {
    ...typography.title,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "500",
    color: themeNew.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: themeNew.textSecondary,
    marginTop: -spacing.sm,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: themeNew.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  monthArrow: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  monthLabel: {
    ...typography.bodyMedium,
    fontSize: 16,
    color: themeNew.textPrimary,
    fontWeight: "600",
  },
  statRow: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: themeNew.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  statValue: {
    ...typography.metric,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "700",
  },
  statLabel: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  chartCard: {
    backgroundColor: themeNew.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    gap: spacing.md,
  },
  chartHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    ...typography.rowTitle,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  chip: {
    backgroundColor: themeNew.blueTint,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: {
    ...typography.microStrong,
    color: themeNew.primary,
    letterSpacing: 0.4,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  section: {
    ...typography.microStrong,
    fontSize: 12,
    lineHeight: 15,
    color: themeNew.textSecondary,
  },
  viewAll: {
    ...typography.bodySmall,
    color: themeNew.primary,
    fontWeight: "600",
  },
  empty: {
    backgroundColor: themeNew.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  emptyText: {
    ...typography.bodySmall,
    color: themeNew.textSecondary,
  },
  episode: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: themeNew.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  episodeChip: {
    width: 63,
    height: 37,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  episodeChipText: {
    ...typography.microStrong,
    fontSize: 11,
  },
  episodeText: { flex: 1, gap: 2 },
  episodeTitle: {
    ...typography.bodyMedium,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  episodeSub: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
});
