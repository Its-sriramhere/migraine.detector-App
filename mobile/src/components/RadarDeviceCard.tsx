import { StyleSheet, Text, View } from "react-native";
import { Bluetooth, Watch } from "lucide-react-native";
import { themeNew } from "../constants/colors";
import { typography } from "../constants/typography";
import { IconCircle } from "./IconCircle";

export type SignalStrength = "strong" | "good" | "fair" | "nearby";

interface Props {
  name: string;
  strength: SignalStrength;
  /** True when the phone already has this device paired. */
  paired?: boolean;
  /** Renders the watch icon instead of the generic Bluetooth glyph. */
  wearable?: boolean;
}

const LABEL: Record<SignalStrength, string> = {
  strong: "Strong signal",
  good: "Good signal",
  fair: "Fair signal",
  nearby: "Nearby",
};

const BARS: Record<SignalStrength, number> = {
  strong: 4,
  good: 3,
  fair: 2,
  nearby: 1,
};

const BAR_COLOR: Record<SignalStrength, string> = {
  strong: "#2FBF71",
  good: "#2FBF71",
  fair: "#F2A33C",
  nearby: "#8A9BC4",
};

/** The device tile that sits on the discovery radar. */
export function RadarDeviceCard({
  name,
  strength,
  paired,
  wearable,
}: Props) {
  const bars = BARS[strength];
  const barColor = BAR_COLOR[strength];

  return (
    <View style={styles.wrap}>
      <View style={styles.iconTile}>
        <IconCircle size={46} background="#FFFFFF" color={themeNew.primary}>
          {wearable ? (
            <Watch size={20} color={themeNew.primary} strokeWidth={2} />
          ) : (
            <Bluetooth size={19} color={themeNew.primary} strokeWidth={2.2} />
          )}
        </IconCircle>
      </View>

      <View style={styles.namePill}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View style={styles.signalRow}>
        <Bluetooth size={11} color={themeNew.primary} strokeWidth={2.6} />
        <View style={styles.bars}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { height: 4 + i * 2 },
                i < bars ? { backgroundColor: barColor } : styles.barEmpty,
              ]}
            />
          ))}
        </View>
        <Text style={[styles.signalLabel, { color: barColor }]}>
          {LABEL[strength]}
        </Text>
        {paired ? <Text style={styles.paired}>Paired</Text> : null}
      </View>
    </View>
  );
}

/** Map an RSSI reading in dBm to a signal band. */
export function strengthFor(rssi: number): SignalStrength {
  if (rssi >= -60) return "strong";
  if (rssi >= -72) return "good";
  if (rssi >= -85) return "fair";
  return "nearby";
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 132, gap: 5 },
  iconTile: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 4,
    shadowColor: "#0C193B",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  namePill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 132,
    shadowColor: "#0C193B",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    ...typography.micro,
    fontWeight: "700",
    fontSize: 11,
    color: themeNew.textPrimary,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 1.5, height: 10 },
  bar: { width: 2.5, borderRadius: 1.5 },
  barEmpty: { backgroundColor: "#D8E1F0" },
  signalLabel: { ...typography.micro, fontSize: 9, fontWeight: "600" },
  paired: { ...typography.micro, fontSize: 9, color: themeNew.primary },
});
