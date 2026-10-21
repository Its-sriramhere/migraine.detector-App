import { useEffect, useState, type ReactNode } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";

/** Brief, native-driver reply entrance without retyping or delaying reading. */
export function MessageReveal({
  children,
  instant,
}: {
  children: ReactNode;
  /** Skip the entrance entirely, for low-stimulation mode. */
  instant?: boolean;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: reduced || instant ? 0 : 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, instant]);
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>{children}</Animated.View>;
}
