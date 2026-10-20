import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { register } from "../services/authService";
import { ApiError } from "../services/api";
import { validateRegister } from "../utils/validation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const v = validateRegister(name, email, password, consent);
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        consent_given: consent,
      });
      await refreshUser();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Unable to register. Try again.",
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
          title="Create account"
          subtitle="Set up your wearable health profile."
        />
        <View style={{ height: spacing.lg }} />

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />

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
          placeholder="Min. 8 characters"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.helper}>
          Stored hashed on the server — never logged or shared.
        </Text>

        <View style={styles.consent}>
          <Switch value={consent} onValueChange={setConsent} />
          <Text style={styles.consentText}>
            I consent to health-data processing for risk estimation.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title="Create account"
          onPress={() => void submit()}
          loading={busy}
        />
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
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
  helper: { ...typography.caption, color: colors.textTertiary, marginTop: -8 },
  consent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.base,
  },
  consentText: { flex: 1, ...typography.bodySmall, color: colors.textSecondary },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  link: {
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.base,
    padding: 8,
    textAlign: "center",
  },
});
