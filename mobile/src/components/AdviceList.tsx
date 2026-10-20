import { StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

/**
 * Backend-provided guidance ("advice"). Informative, never alarming, and
 * never presented as a diagnosis.
 */
export function AdviceList({
  advice,
  title = "What to do now",
}: {
  advice?: string[];
  title?: string;
}) {
  if (!advice || advice.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Sparkles color={colors.primary} size={16} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {advice.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.item}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.base,
    gap: 6,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { ...typography.h3, color: colors.primaryDark },
  item: { flexDirection: "row", gap: 8 },
  bullet: { color: colors.primaryDark, fontSize: 15, lineHeight: 21 },
  text: { ...typography.bodySmall, color: colors.primaryDark, flex: 1 },
});
