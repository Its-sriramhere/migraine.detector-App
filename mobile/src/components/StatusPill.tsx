import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

export function StatusPill({
  label,
  text,
  background,
}: {
  label: string;
  text: string;
  background: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  text: { ...typography.captionStrong, letterSpacing: 0.4 },
});
