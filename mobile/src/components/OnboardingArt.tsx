import { Activity, Circle, Heart, PieChart } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { OnboardingWatch } from "./OnboardingWatch";

/**
 * Illustration cluster from the Figma "02 Onboarding" screen: the watch
 * floating over two soft blue discs with four tinted metric badges around
 * it. Positions are taken straight from the Figma frame (390 x 844).
 */
const ART_W = 271;
const ART_H = 343;

export function OnboardingArt() {
  return (
    <View style={styles.art}>
      <View style={styles.discOuter} />
      <View style={styles.discInner} />

      <View style={styles.watch}>
        <OnboardingWatch width={159} />
      </View>

      <View style={[styles.badge, styles.badgeHeart]}>
        <Heart size={22} color="#F2636B" strokeWidth={2.4} fill="#F2636B" />
      </View>

      <View style={[styles.badge, styles.badgeActivity]}>
        <Activity size={20} color="#246BE8" strokeWidth={2.4} />
      </View>

      <View style={[styles.badge, styles.badgeMoon]}>
        <PieChart size={19} color="#8466F0" strokeWidth={2.2} />
      </View>

      <View style={[styles.badge, styles.badgeDrop]}>
        <Circle size={17} color="#27B985" strokeWidth={2.4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { width: ART_W, height: ART_H, alignSelf: "center" },
  discOuter: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "#EDF4FF",
  },
  discInner: {
    position: "absolute",
    left: 47,
    top: 40,
    width: 162,
    height: 162,
    borderRadius: 81,
    backgroundColor: "#D5E8FF",
  },
  watch: { position: "absolute", left: 50, top: 16 },
  badge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  badgeHeart: {
    left: 3,
    top: 11,
    width: 54,
    height: 54,
    backgroundColor: "#FFF0F0",
  },
  badgeActivity: {
    left: 222,
    top: 44,
    width: 49,
    height: 49,
    backgroundColor: "#EDF4FF",
  },
  badgeMoon: {
    left: 1,
    top: 241,
    width: 48,
    height: 48,
    backgroundColor: "#F1EDFF",
  },
  badgeDrop: {
    left: 219,
    top: 255,
    width: 48,
    height: 48,
    backgroundColor: "#E2F8ED",
  },
});
