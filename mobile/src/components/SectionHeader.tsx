import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { themeNew } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/**
 * Large screen title with a back chevron, used by the newer Figma frames
 * (Prediction, History, Sleep) so a section can always be left again.
 */
export function SectionHeader({ title, subtitle, onBack }: Props) {
  return (
    <View>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.back}
          hitSlop={10}
        >
          <ChevronLeft color={themeNew.textPrimary} size={26} strokeWidth={2.4} />
        </Pressable>
      ) : null}

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "500",
    color: themeNew.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: themeNew.textSecondary,
    marginTop: -spacing.sm,
  },
});
