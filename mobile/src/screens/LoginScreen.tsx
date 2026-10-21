import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppLogo } from "../components/AppLogo";
import { AmbientBackground } from "../components/AmbientBackground";
import { Input } from "../components/Input";
import { PageTitle } from "../components/PageTitle";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useSectionEntrance } from "../hooks/useSectionEntrance";
import type { AuthStackParamList, RootStackParamList } from "../navigation/types";
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
  const entrance = useSectionEntrance(2);

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
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AmbientBackground />

        <Animated.View style={[styles.brand, entrance(0)]}>
          <AppLogo size={52} />
        </Animated.View>

        <Animated.View style={[styles.panel, entrance(1)]}>
          <PageTitle
            title="Welcome back"
            subtitle="Sign in to continue monitoring."
          />
          <View style={{ height: spacing.lg }} />

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
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
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
          <Pressable accessibilityRole="button" onPress={() => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Backend")}>
            <Text style={[styles.link, { textAlign: "center", marginTop: 12 }]}>Backend connection</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: themeNew.background },
  content: {
    padding: spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  brand: { alignItems: "center", marginBottom: spacing.lg },
  panel: {
    backgroundColor: themeNew.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: themeNew.border,
    padding: spacing.xl,
    shadowColor: "#0B1F3A",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.base,
  },
  link: { color: colors.primary, fontWeight: "600", padding: 8 },
});
