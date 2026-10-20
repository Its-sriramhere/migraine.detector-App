import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BatteryCharging, Check, RefreshCw, Watch } from "lucide-react-native";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { PrimaryButton } from "../components/PrimaryButton";
import { WatchMock } from "../components/WatchMock";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useWatch } from "../hooks/useWatch";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Watch">;

export function WatchScreen(_: Props) {
  const insets = useSafeAreaInsets();
  const [simulated, setSimulated] = useState(true);
  const watch = useWatch({ simulated });
  const [busy, setBusy] = useState(false);

  const connected = watch.state === "connected";

  const onScan = async () => {
    setBusy(true);
    await watch.scan();
    setBusy(false);
  };

  const onConnect = async (id: string) => {
    setBusy(true);
    await watch.connect(id);
    setBusy(false);
  };

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Wearable Connection</Text>

      <View style={styles.hero}>
        <WatchMock width={130} />
        <View style={styles.badge}>
          <IconCircle size={52} background={colors.lowBackground} color={colors.low}>
            <Check size={22} color={colors.low} strokeWidth={3} />
          </IconCircle>
        </View>
      </View>

      {connected ? (
        <>
          <Text style={styles.state}>Device Connected</Text>
          <Text style={styles.stateSub}>
            {watch.info
              ? `Last synced ${watch.info.firmware.startsWith("sim") ? "just now" : "a few seconds ago"}`
              : "Last synced just now"}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.state}>Device Not Connected</Text>
          <Text style={styles.stateSub}>
            {watch.error ??
              "Pair your wearable to stream sleep, HRV, blood pressure and SpO₂."}
          </Text>
        </>
      )}

      <Card style={styles.infoCard}>
        <IconCircle size={34} background={colors.blueTint} color={colors.primary}>
          <BatteryCharging size={16} color={colors.primary} />
        </IconCircle>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Battery status</Text>
          <Text style={styles.infoSub}>
            {watch.info ? `${watch.info.battery}% remaining` : "—"}
          </Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <IconCircle size={34} background={colors.blueTint} color={colors.primary}>
          <RefreshCw size={16} color={colors.primary} />
        </IconCircle>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Sync wearable data</Text>
          <Text style={styles.infoSub}>Tap to update current measurements</Text>
        </View>
      </Card>

      {watch.vitals ? (
        <Card>
          <Text style={styles.cardTitle}>Live from the wearable</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vital}>
              <Text style={styles.vitalLabel}>Heart rate</Text>
              <Text style={styles.vitalValue}>
                {watch.vitals.heart_rate} BPM
              </Text>
            </View>
            <View style={styles.vital}>
              <Text style={styles.vitalLabel}>HRV</Text>
              <Text style={styles.vitalValue}>{watch.vitals.hrv} ms</Text>
            </View>
            <View style={styles.vital}>
              <Text style={styles.vitalLabel}>Blood pressure</Text>
              <Text style={styles.vitalValue}>
                {watch.vitals.systolic_bp}/{watch.vitals.diastolic_bp}
              </Text>
            </View>
            <View style={styles.vital}>
              <Text style={styles.vitalLabel}>SpO₂</Text>
              <Text style={styles.vitalValue}>{watch.vitals.spo2}%</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <PrimaryButton
        title={connected ? "Sync now" : "Scan for wearables"}
        onPress={() => (connected ? watch.disconnect() : void onScan())}
        loading={busy}
      />

      {!connected && watch.devices.length > 0 ? (
        <View style={styles.deviceList}>
          {watch.devices.map((d) => (
            <Card key={d.id} style={styles.infoCard}>
              <IconCircle size={34} background={colors.lavender} color={colors.lavenderStrong}>
                <Watch size={16} color={colors.lavenderStrong} />
              </IconCircle>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{d.name}</Text>
                <Text style={styles.infoSub}>Signal {d.rssi} dBm</Text>
              </View>
              <PrimaryButton
                title="Pair"
                variant="secondary"
                onPress={() => void onConnect(d.id)}
              />
            </Card>
          ))}
        </View>
      ) : null}

      {simulated ? (
        <View style={styles.simulatedNotice}>
          <Text style={styles.simulatedText}>
            Using simulated wearable{" — real hardware when available"}
          </Text>
        </View>
      ) : watch.unavailableReason && (
        <View style={styles.unavailableNotice}>
          <Text style={styles.unavailableText}>
            {"Bluetooth runs in a development build. "}{"Use simulated wearable to continue."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.screenTitle, color: colors.textPrimary },
  hero: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg },
  badge: { marginTop: -46, marginLeft: 86 },
  state: { ...typography.screenTitle, color: colors.textPrimary, textAlign: "center" },
  stateSub: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.card },
  infoText: { flex: 1, gap: 1 },
  infoTitle: { ...typography.bodyMedium, fontWeight: "600", color: colors.textPrimary },
  infoSub: { ...typography.micro, color: colors.textSecondary },
  cardTitle: { ...typography.section, color: colors.textPrimary, marginBottom: spacing.sm },
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  vital: { flexBasis: "45%", flexGrow: 1 },
  vitalLabel: { ...typography.micro, color: colors.textSecondary },
  vitalValue: { ...typography.rowTitle, color: colors.textPrimary },
  deviceList: { gap: spacing.sm },
  simulatedNotice: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  simulatedText: {
    ...typography.caption,
    color: colors.primaryDark,
    textAlign: "center",
  },
  unavailableNotice: {
    backgroundColor: colors.highPale,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  unavailableText: {
    ...typography.caption,
    color: colors.high,
    textAlign: "center",
  },
  note: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
