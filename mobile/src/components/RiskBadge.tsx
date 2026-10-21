import { StyleSheet, Text, View } from "react-native";
import { riskColors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

export function RiskBadge({
  level,
  small,
}: {
  level: string;
  small?: boolean;
}) {
  const rc = riskColors(level);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: rc.background },
        small && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, { color: rc.text }, small && styles.textSmall]}>
        {level.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { ...typography.caption, fontWeight: "700", letterSpacing: 0.5 },
  textSmall: { fontSize: 11 },
});
