import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import type { Device } from "../types";
import { Card } from "./Card";

export function PiStatus({ devices }: { devices: Device[] }) {
  const online = devices.filter(
    (d) => d.status === "online" || d.status === "connected",
  ).length;
  return (
    <Card>
      <Text style={styles.title}>Raspberry Pi</Text>
      <Text style={styles.row}>
        {devices.length === 0
          ? "○ No devices registered"
          : online > 0
            ? `● Connected (${online}/${devices.length})`
            : "○ Disconnected"}
      </Text>
      {devices.slice(0, 4).map((d) => (
        <Text key={d.id} style={styles.device}>
          {d.device_name || d.device_identifier} — {d.status}
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  row: { color: colors.textSecondary, marginBottom: spacing.sm },
  device: { fontSize: 12, color: colors.textTertiary },
});
