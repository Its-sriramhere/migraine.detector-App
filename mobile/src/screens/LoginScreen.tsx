import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageTitle } from "../components/PageTitle";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import type { AuthStackParamList } from "../navigation/types";
import { login } from "../services/authService";
import { ApiError } from "../services/api";
import { validateLogin } from "../utils/validation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const v = validateLogin(email, password);
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      await refreshUser();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Unable to sign in. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrap}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle
          title="Welcome back"
          subtitle="Sign in to continue monitoring."
        />
        <View style={{ height: spacing.lg }} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Sign In" onPress={() => void submit()} loading={busy} />

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Create account</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, flexGrow: 1, justifyContent: "center" },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.base,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.base,
  },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.base,
  },
  link: { color: colors.primary, fontWeight: "600", padding: 8 },
});
