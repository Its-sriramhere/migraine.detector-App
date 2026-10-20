import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface Props {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /**
   * Optional link rendered under the label. It sits outside the checkbox
   * press target so tapping it never toggles the checkbox.
   */
  link?: { label: string; onPress: () => void };
  error?: string;
}

/** Agreement checkbox used for the privacy policy and health-data consent. */
export function ConsentCheck({ checked, onToggle, children, link, error }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={typeof children === "string" ? children : undefined}
          onPress={onToggle}
          style={styles.boxHit}
          hitSlop={6}
        >
          <View style={[styles.box, checked && styles.boxChecked]}>
            {checked ? (
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.textWrap}>
          <Text style={styles.text}>{children}</Text>
          {link ? (
            <Pressable accessibilityRole="link" onPress={link.onPress}>
              <Text style={styles.link}>{link.label}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  boxHit: { paddingTop: 1 },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  textWrap: { flex: 1, gap: 2 },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  link: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: 2,
  },
});
