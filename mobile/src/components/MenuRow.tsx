import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";
import { IconCircle } from "./IconCircle";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

/** Settings-style row: tinted icon circle + title + subtitle. */
export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
}: Props) {
  const body = (
    <Card style={styles.card}>
      <IconCircle size={48} background={colors.blueTint} color={colors.primary}>
        {icon}
      </IconCircle>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <ChevronRight color={colors.textTertiary} size={18} />
      ) : null}
    </Card>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.card,
  },
  textWrap: { flex: 1, gap: 1 },
  title: { ...typography.rowTitle, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
});
