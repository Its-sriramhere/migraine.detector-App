import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { themeNew } from "../constants/colors";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { MiraMark } from "./MiraMark";

/**
 * Mira floating button.
 *
 * Uses the shared brand mark with the green availability dot, and breathes
 * gently so it reads as an assistant that is present rather than an icon
 * stuck on the screen. The halo pulses behind the disc and the whole button
 * floats up and down on a slow loop. Both animations are skipped when the
 * user has asked for reduced motion.
 *
 * It deliberately overlaps the content above the bottom navigation, the way
 * the Figma frame shows it.
 */
const SIZE = 58;

export function MiraFab({
  onPress,
  bottom = 92,
  right = 16,
}: {
  onPress: () => void;
  /** Distance from the bottom of the screen. */
  bottom?: number;
  right?: number;
}) {
  const reduced = useReducedMotion();
  const [float] = useState(() => new Animated.Value(0));
  const [halo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      float.setValue(0);
      halo.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    pulse.start();
    return () => {
      loop.stop();
      pulse.stop();
    };
  }, [reduced, float, halo]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1.5],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.root,
        { bottom, right },
        { transform: [{ translateY }] },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />
      <Pressable
        testID="mira-fab"
        accessibilityRole="button"
        accessibilityLabel="Open Mira assistant"
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <View pointerEvents="none">
          <MiraMark size={SIZE} withStatus />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: themeNew.miraPrimary,
  },
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: themeNew.miraPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { transform: [{ scale: 0.92 }], opacity: 0.92 },
});
