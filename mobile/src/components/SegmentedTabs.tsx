import { ScrollView, StyleSheet, Text, Pressable } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

interface Props<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}

/** Horizontal pill tabs used on the Health Metrics screen. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 },
  pill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: 18,
    minHeight: 40,
    justifyContent: "center",
  },
  pillActive: { backgroundColor: colors.primary },
  text: { ...typography.bodyMedium, color: colors.textSecondary },
  textActive: { color: "#FFFFFF", fontWeight: "600" },
});
