import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { Bluetooth, CircleHelp, ChevronLeft } from "lucide-react-native";
import { themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { watchService, type DiscoveredWatch } from "../services/watchService";

import { RadarDeviceCard, strengthFor } from "../components/RadarDeviceCard";

interface Props {
  navigation: { goBack: () => void };
}

/** Where each device tile sits on the radar, as a fraction of the ring. */
const SLOTS: { x: number; y: number }[] = [
  { x: 0.5, y: 0.04 },
  { x: 0.05, y: 0.33 },
  { x: 0.95, y: 0.33 },
  { x: 0.11, y: 0.72 },
  { x: 0.89, y: 0.72 },
];

/**
 * Connect Wearable — the circular discovery radar.
 *
 * Shows the watches already paired to this phone and the devices currently
 * advertising nearby, arranged around a central Bluetooth button. The scan
 * is unfiltered so the list matches what the system Bluetooth settings
 * shows, and a device is only marked as a wearable when it advertises the
 * Bluetooth SIG Heart Rate service.
 */
export function ConnectWearableScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredWatch[]>([]);
  const [paired, setPaired] = useState<DiscoveredWatch[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, spin]);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setMessage(null);
    try {
      const bonded = await watchService.pairedDevices();
      setPaired(bonded);
      const found = await watchService.scan(8000);
      setDevices(found);
      setBluetoothOn(true);
      setMessage(
        found.length === 0
          ? "No devices nearby yet. Make sure your wearable is awake and in pairing mode."
          : `Found ${found.length} device${found.length === 1 ? "" : "s"} nearby.`,
      );
    } catch (e) {
      const text = e instanceof Error ? e.message : "Bluetooth scan failed.";
      setError(text);
      if (/turn on bluetooth/i.test(text)) setBluetoothOn(false);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the first render happens before the scan sets any state.
    void Promise.resolve().then(scan);
  }, [scan]);

  const onConnect = async (device: DiscoveredWatch) => {
    setConnecting(device.id);
    setError(null);
    try {
      await watchService.connect(device.id);
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to that device.");
    } finally {
      setConnecting(null);
    }
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Bonded devices first, then nearby, with no duplicate.
  const merged: DiscoveredWatch[] = [];
  for (const device of [...paired, ...devices]) {
    if (!merged.some((d) => d.id === device.id)) merged.push(device);
  }
  const tiles = merged.slice(0, SLOTS.length);

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <ChevronLeft size={20} color={themeNew.primary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Connect Wearable</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bluetooth help"
          onPress={() =>
            Linking.openURL("https://developer.android.com/develop/connectivity/bluetooth/bt-permissions")
          }
          style={styles.iconButton}
        >
          <CircleHelp size={20} color={themeNew.primary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Find and connect your smartwatch or health wearable
        </Text>

        <View style={styles.radar}>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Circle
              cx="50%"
              cy="50%"
              r="46%"
              stroke="#BBD4F7"
              strokeWidth={1.5}
              strokeDasharray="5 6"
              fill="none"
            />
            <Circle cx="50%" cy="50%" r="30%" fill="#EAF5FF" opacity={0.7} />
            <Circle cx="50%" cy="50%" r="22%" fill="#F4FAFF" opacity={0.8} />
          </Svg>

          {tiles.map((device, index) => {
            const slot = SLOTS[index];
            return (
              <Pressable
                key={device.id}
                onPress={() => void onConnect(device)}
                disabled={connecting !== null}
                style={[
                  styles.tile,
                  {
                    left: `${slot.x * 100}%`,
                    top: `${slot.y * 100}%`,
                  },
                ]}
              >
                <RadarDeviceCard
                  name={device.name}
                  strength={strengthFor(device.rssi)}
                  paired={device.paired}
                  wearable={device.looksLikeWearable}
                />
              </Pressable>
            );
          })}

          <View style={styles.centre}>
            <Animated.View
              style={[
                styles.arc,
                { transform: [{ rotate }] },
              ]}
              pointerEvents="none"
            >
              <Svg width={116} height={116}>
                <Path
                  d="M58 8 A50 50 0 0 1 104 40"
                  stroke={themeNew.primary}
                  strokeWidth={3}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
            <View style={styles.centreButton}>
              {scanning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Bluetooth size={30} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </View>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {scanning
              ? "Scanning for nearby devices..."
              : (message ?? "Ready to scan")}
          </Text>
        </View>

        {error ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Bluetooth needs attention</Text>
            <Text style={styles.infoBody}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={styles.infoAction}
            >
              <Text style={styles.infoActionText}>Open Settings</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.infoHead}>
              <Bluetooth size={14} color={themeNew.primary} strokeWidth={2.4} />
              <Text style={styles.infoTitle}>
                {bluetoothOn ? "Bluetooth is on" : "Bluetooth is off"}
              </Text>
            </View>
            <Text style={styles.infoBody}>
              {"Keep your wearable nearby and make sure it's in pairing mode."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void scan()}
              style={styles.infoAction}
            >
              <Text style={styles.infoActionText}>
                {scanning ? "Scanning..." : "Scan again"}
              </Text>
            </Pressable>
          </View>
        )}

        {tiles.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.listTitle}>
              {paired.length > 0 ? "PAIRED ON THIS PHONE" : "NEARBY DEVICES"}
            </Text>
            {merged.map((device) => (
              <Pressable
                key={device.id}
                onPress={() => void onConnect(device)}
                disabled={connecting !== null}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {device.name}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {device.paired
                      ? "Paired on this phone"
                      : device.looksLikeWearable
                        ? "Advertises heart rate"
                        : "Nearby device"}
                  </Text>
                </View>
                {connecting === device.id ? (
                  <ActivityIndicator size="small" color={themeNew.primary} />
                ) : (
                  <Text style={styles.rowAction}>Connect</Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7FBFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h3,
    color: themeNew.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: "#6480A7",
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  content: { paddingHorizontal: spacing.base, gap: spacing.base },
  radar: {
    height: 420,
    marginTop: spacing.sm,
  },
  tile: {
    position: "absolute",
    width: 132,
    marginLeft: -66,
    alignItems: "center",
  },
  centre: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 92,
    height: 92,
    marginLeft: -46,
    marginTop: -46,
    alignItems: "center",
    justifyContent: "center",
  },
  arc: { position: "absolute" },
  centreButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#1D7FF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D7FF6",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#2FBF71",
  },
  statusText: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: themeNew.textPrimary,
  },
  infoCard: {
    backgroundColor: "#E9F4FF",
    borderRadius: radius.card,
    padding: spacing.base,
    gap: 6,
  },
  infoHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  infoTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: themeNew.textPrimary,
  },
  infoBody: {
    ...typography.bodySmall,
    color: "#6480A7",
    textAlign: "center",
    lineHeight: 19,
  },
  infoAction: { alignSelf: "center", paddingTop: 4 },
  infoActionText: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: themeNew.primary,
  },
  list: { gap: 8 },
  listTitle: {
    ...typography.micro,
    fontSize: 10,
    letterSpacing: 1.1,
    color: "#6480A7",
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: "#F2F7FE" },
  rowText: { flex: 1, gap: 1 },
  rowName: { ...typography.bodyMedium, fontWeight: "600", color: themeNew.textPrimary },
  rowMeta: { ...typography.micro, fontSize: 11, color: "#6480A7" },
  rowAction: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: themeNew.primary,
  },
});
