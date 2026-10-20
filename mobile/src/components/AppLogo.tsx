import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { BrainArt } from "./BrainArt";

/**
 * The Migraine Detector app mark: a circle carrying the brand gradient with
 * the neural motif from the Figma splash artwork inside it.
 */
export function AppLogo({ size = 52 }: { size?: number }) {
  // The brain is drawn on a 272-unit grid, so scale it into the mark.
  const brain = size * 0.66;

  return (
    <View
      style={[
        styles.mark,
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
        <BrainArt
          size={brain}
          color="#FFFFFF"
          accent="#FFFFFF"
          showRings={false}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
