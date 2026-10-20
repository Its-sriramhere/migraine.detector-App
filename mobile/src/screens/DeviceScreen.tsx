import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { LoadingState } from "../components/LoadingState";
import { EmptyState, ErrorState } from "../components/States";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { Device } from "../types";
import { ApiError } from "../services/api";
import * as deviceService from "../services/deviceService";
import { timeAgo } from "../utils/formatting";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Device">;

const STEPS = [
  "Flash the edge application on the Raspberry Pi (raspberry-pi/main.py).",
  "Set BACKEND_URL and AUTH_TOKEN in raspberry-pi/config/settings.py.",
  "Start the Pi so it registers itself: POST /api/devices/register.",
  "Keep the Pi online — it posts a reading every 10 s and a heartbeat every 60 s.",
];

export function DeviceScreen(_: Props) {
  const insets = useSafeAreaInsets();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    deviceService
      .getDevices()
      .then(setDevices)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load devices."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const register = async () => {
    if (!identifier.trim()) {
      setError("Enter the device identifier shown on the Pi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deviceService.registerDevice({
        device_identifier: identifier.trim(),
        device_name: name.trim() || identifier.trim(),
      });
      setIdentifier("");
      setName("");
      load();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Unable to register the device.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Raspberry Pi</Text>
      <Text style={styles.sub}>
        The phone never talks to the I2C sensors directly. Readings always
        travel Sensors → Pi → Backend → App.
      </Text>

      {loading ? (
        <LoadingState message="Loading devices…" />
      ) : error && devices.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : devices.length === 0 ? (
        <EmptyState
          title="No devices registered"
          message="Register your Pi below to see its online status here."
        />
      ) : (
        devices.map((d) => {
          const online = d.status === "online" || d.status === "connected";
          return (
            <Card key={d.id}>
              <View style={styles.deviceHead}>
                <Text style={styles.deviceName}>
                  {d.device_name || d.device_identifier}
                </Text>
                <Text style={[styles.status, { color: online ? colors.low : colors.textTertiary }]}>
                  {online ? "● Online" : "○ Offline"}
                </Text>
              </View>
              <Text style={styles.deviceMeta}>Identifier {d.device_identifier}</Text>
              <Text style={styles.deviceMeta}>
                Last seen {d.last_seen ? timeAgo(d.last_seen) : "never"}
              </Text>
            </Card>
          );
        })
      )}

      <Text style={styles.section}>Register a device</Text>
      <Card>
        <Input
          label="Device identifier"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="PI-001"
          autoCapitalize="none"
        />
        <Input
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="Home Pi"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Register device" onPress={() => void register()} loading={busy} />
      </Card>

      <Text style={styles.section}>Connection guide</Text>
      <Card>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
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
  deviceHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceName: { ...typography.h3, color: colors.textPrimary },
  status: { ...typography.caption, fontWeight: "700" },
  deviceMeta: { ...typography.caption, color: colors.textTertiary },
  error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  step: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "700",
    fontSize: 12,
  },
  stepText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
});
