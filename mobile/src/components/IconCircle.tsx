import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";

interface Props {
  children: ReactNode;
  size?: number;
  background?: string;
  color?: string;
}

/** Tinted circle that holds a small glyph — used all over the Figma design. */
export function IconCircle({
  children,
  size = 44,
  background = colors.blueTint,
  color = colors.primary,
}: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    >
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
});
