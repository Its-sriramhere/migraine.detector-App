import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { Card } from "./Card";
import { IconCircle } from "./IconCircle";

interface Props {
  icon: ReactNode;
  title: string;
  body?: string;
}

/** Recommendation row: tinted icon circle + title + supporting line. */
export function RecommendationCard({ icon, title, body }: Props) {
  return (
    <Card style={styles.card}>
      <IconCircle size={48} background={colors.blueTint} color={colors.primary}>
        {icon}
      </IconCircle>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.card,
  },
  text: { flex: 1, gap: 1 },
  title: { ...typography.rowTitle, color: colors.textPrimary },
  body: { ...typography.bodySmall, color: colors.textSecondary },
});
