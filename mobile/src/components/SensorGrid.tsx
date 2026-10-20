import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { timeAgo } from "../utils/formatting";
import { Card } from "./Card";

interface Item {
  icon: string;
  name: string;
  value: string;
  unit?: string;
  status: "live" | "demo" | "stale";
  updatedAt?: string;
  onPress?: () => void;
}

function statusLabel(s: Item["status"]): string {
  if (s === "live") return "● Live";
  if (s === "demo") return "● Demo";
  return "● Stale";
}

export function SensorCard({ item }: { item: Item }) {
  const body = (
    <>
      <Text style={styles.name}>
        {item.icon} {item.name}
      </Text>
      <Text style={styles.value}>
        {item.value}{" "}
        {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : null}
      </Text>
      <Text style={styles.status}>{statusLabel(item.status)}</Text>
      {item.updatedAt ? (
        <Text style={styles.updated}>{timeAgo(item.updatedAt)}</Text>
      ) : null}
    </>
  );
  if (!item.onPress) return <Card>{body}</Card>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={item.onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <Card>{body}</Card>
    </Pressable>
  );
}

export function SensorGrid({ items }: { items: Item[] }) {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.name} style={styles.cell}>
          <SensorCard item={it} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: { flexBasis: "48%", flexGrow: 1, minWidth: 150 },
  name: { ...typography.bodySmall, color: colors.textSecondary },
  value: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  unit: { fontSize: 13, fontWeight: "400", color: colors.textSecondary },
  status: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  updated: { fontSize: 11, color: colors.textTertiary },
});
