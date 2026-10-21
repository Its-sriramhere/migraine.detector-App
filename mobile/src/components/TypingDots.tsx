import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { themeNew } from "../constants/colors";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Three-dot "Mira is typing" indicator. The dots rise and fall in sequence
 * so a reply that comes back instantly still reads as a considered answer.
 */
export function TypingDots({ color = themeNew.primary }: { color?: string }) {
  const [dots] = useState(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { dots.forEach((dot) => dot.setValue(1)); return; }
    const loop = Animated.loop(Animated.stagger(150, dots.map((value) =>
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
    )));
    loop.start();
    return () => { loop.stop(); dots.forEach((dot) => dot.setValue(0)); };
  }, [dots, reduced]);

  return (
    <View style={styles.row} accessibilityLabel="Mira is typing">
      {dots.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              opacity: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  translateY: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
                {
                  scale: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
