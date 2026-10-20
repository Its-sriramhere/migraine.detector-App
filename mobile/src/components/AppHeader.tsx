import type { ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  /**
   * "center" puts the chevron beside a centred title, "left" puts it
   * beside a left-aligned title so a screen can keep its own type scale.
   */
  layout?: "center" | "left";
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
}

/** Back chevron + title + optional trailing action. */
export function AppHeader({
  title,
  onBack,
  right,
  layout = "center",
  titleStyle,
  subtitle,
}: Props) {
  const backButton = onBack ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onBack}
      style={layout === "left" ? styles.backLeft : styles.back}
      hitSlop={8}
    >
      <ChevronLeft color={colors.textPrimary} size={26} strokeWidth={2.4} />
    </Pressable>
  ) : null;

  if (layout === "left") {
    return (
      <View style={styles.rowLeft}>
        {backButton}
        <View style={styles.leftText}>
          <Text style={[styles.titleLeft, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.rightLeft}>{right}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.side}>{backButton}</View>
      <Text style={[styles.title, titleStyle]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 44,
  },
  side: { width: 44, alignItems: "flex-start" },
  sideRight: { alignItems: "flex-end" },
  back: { width: 44, height: 44, justifyContent: "center" },
  title: {
    ...typography.headerTitle,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
  },
  backLeft: {
    width: 40,
    height: 44,
    justifyContent: "center",
    marginLeft: -6,
  },
  leftText: { flex: 1 },
  titleLeft: {
    ...typography.headerTitle,
    color: colors.textPrimary,
  },
  rightLeft: { marginLeft: spacing.sm },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
