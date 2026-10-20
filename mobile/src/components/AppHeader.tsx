import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Back chevron + centred title + optional trailing action. */
export function AppHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.back}
            hitSlop={8}
          >
            <ChevronLeft color={colors.textPrimary} size={26} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
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
});
