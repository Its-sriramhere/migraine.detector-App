import { Sparkle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

/**
 * The Migraine Detector app mark from the Figma: a rounded blue square with
 * the four-point sparkle. The Mira assistant uses the same sparkle, so the
 * two read as one family.
 */
export function AppLogo({ size = 52 }: { size?: number }) {
  const radius = Math.round(size * 0.308);

  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Sparkle
        size={Math.round(size * 0.52)}
        color="#FFFFFF"
        strokeWidth={1.6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: "#2869E7",
    alignItems: "center",
    justifyContent: "center",
  },
});
