import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import type { AuthStackParamList } from "../navigation/types";
import { register } from "../services/authService";
import { ApiError } from "../services/api";
import { validateRegister } from "../utils/validation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
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
      <Text style={styles.title}>Create account</Text>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 8 characters"
        secureTextEntry
        autoCapitalize="none"
        helper="Stored hashed on the server; never logged."
      />
      <View style={styles.consent}>
        <Switch value={consent} onValueChange={setConsent} />
        <Text style={styles.consentText}>
          I consent to health-data processing for risk estimation.
        </Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Register" onPress={submit} loading={busy} />
      <Pressable onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 12 },
  consent: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  consentText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  error: { color: colors.error, marginBottom: spacing.sm },
  link: {
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.base,
    padding: 8,
  },
});
