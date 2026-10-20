import { Sparkle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { themeNew } from "../constants/colors";

/**
 * The Mira assistant mark: the same brand gradient disc as the app mark with
 * the four-point sparkle in place of the neural motif, so the two read as
 * one family.
 */
export function MiraMark({
  size = 58,
  withStatus = false,
}: {
  size?: number;
  /** Show the green "available" dot, used on the floating button. */
  withStatus?: boolean;
}) {
  const sparkle = Math.round(size * 0.46);
  const dot = Math.round(size * 0.19);

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <LinearGradient
        colors={["#2D73F2", "#6D58E8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Sparkle size={sparkle} color="#FFFFFF" strokeWidth={1.6} />
      </LinearGradient>

      {withStatus ? (
        <View
          style={[
            styles.status,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              top: Math.round(size * 0.09),
              right: Math.round(size * 0.09),
              borderWidth: Math.max(1.5, Math.round(size * 0.035)),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  status: {
    position: "absolute",
    backgroundColor: themeNew.miraAvailable,
    borderColor: "#FFFFFF",
  },
});
