import { useEffect, useMemo } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

/** Duration of one section's fade-and-rise. */
const DURATION = 220;
/** Delay added per section so the blocks enter one after another. */
const STAGGER = 55;
/** Cap on the stagger so long screens still finish inside ~600ms. */
const MAX_DELAY_STEPS = 6;
/** Distance each section rises while fading in. */
const RISE = 12;

/** Used when a screen asks for a section that does not exist. */
const FALLBACK = new Animated.Value(1);

/** Animated style returned for a section: opacity plus a small rise. */
export type SectionEntranceStyle = Animated.WithAnimatedObject<ViewStyle>;

/**
 * Staggered entrance for the major blocks of a screen.
 *
 * `sectionStyle(index)` returns the animated style for the block at that
 * index: a gentle fade-and-rise that runs on the native driver, so it never
 * animates layout and never blocks interaction.
 *
 * When the user prefers reduced motion the animation is skipped entirely
 * and every block renders in its final state immediately.
 *
 * @param count  number of animated blocks on the screen
 * @param active set to false while the screen is still loading, so the
 *               entrance plays when the content actually appears
 */
export function useSectionEntrance(count: number, active = true) {
  const reduced = useReducedMotion();
  const progress = useMemo(
    () =>
      Array.from({ length: count }, () => new Animated.Value(reduced ? 1 : 0)),
    [count, reduced],
  );

  useEffect(() => {
    if (reduced || !active) {
      progress.forEach((value) => value.setValue(1));
      return;
    }
    progress.forEach((value) => value.setValue(0));
    const animations = progress.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: DURATION,
        delay: Math.min(index, MAX_DELAY_STEPS) * STAGGER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [progress, reduced, active]);

  const sectionStyle = (index: number): SectionEntranceStyle => {
    const value = progress[index] ?? FALLBACK;
    return {
      opacity: value,
      transform: [
        {
          translateY: value.interpolate({
            inputRange: [0, 1],
            outputRange: [RISE, 0],
          }),
        },
      ],
    };
  };

  return sectionStyle;
}
