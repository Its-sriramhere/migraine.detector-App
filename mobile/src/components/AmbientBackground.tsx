import { StyleSheet, View } from "react-native";

/** Low-opacity brand atmosphere; never intercepts taps or changes layout. */
export function AmbientBackground() {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.layer}>
      <View style={styles.blue} />
      <View style={styles.violet} />
      <View style={styles.ring} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, height: 640, overflow: "hidden" },
  blue: { position: "absolute", width: 360, height: 360, borderRadius: 180, top: -170, right: -130, backgroundColor: "rgba(45,115,242,0.045)" },
  violet: { position: "absolute", width: 280, height: 280, borderRadius: 140, top: 210, left: -190, backgroundColor: "rgba(109,88,232,0.035)" },
  ring: { position: "absolute", width: 300, height: 300, borderRadius: 150, top: -130, right: -100, borderWidth: 1, borderColor: "rgba(45,115,242,0.05)" },
});
