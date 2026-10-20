import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  helper?: string;
  error?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  helper,
  error,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={isPassword && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
          placeholderTextColor={colors.textTertiary}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((r) => !r)}
            style={styles.toggle}
            hitSlop={6}
          >
            {revealed ? (
              <EyeOff size={20} color={colors.textSecondary} strokeWidth={1.9} />
            ) : (
              <Eye size={20} color={colors.textSecondary} strokeWidth={1.9} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  rowError: { borderColor: colors.error },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    fontSize: 16,
    color: colors.textPrimary,
  },
  toggle: {
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },
  error: { ...typography.caption, color: colors.error, marginTop: 4 },
});
