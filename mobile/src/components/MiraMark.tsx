import { BrandGlyph } from "./BrandGlyph";
import { StyleSheet, View } from "react-native";
import { themeNew } from "../constants/colors";

/**
 * The Mira assistant mark.
 *
 * The brand sheet shows one mark for both the app and Mira - the Brain + ECG
 * symbol at two sizes - so this renders the shared brand glyph and only adds
 * the green "available" dot when asked.
 */
export function MiraMark({
  size = 58,
  withStatus = false,
}: {
  size?: number;
  /** Show the green "available" dot, used on the floating button. */
  withStatus?: boolean;
}) {
  const dot = Math.round(size * 0.19);

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <BrandGlyph size={size} />

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
