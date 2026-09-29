import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";

export function DemoBanner() {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.title}>DEMO MODE</Text>
      <Text style={styles.sub}>Values are simulated.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.moderateBackground,
    borderColor: colors.moderate,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
  },
  title: { fontWeight: "700", color: colors.moderateText, letterSpacing: 1 },
  sub: { color: colors.moderateText, fontSize: 13 },
});
