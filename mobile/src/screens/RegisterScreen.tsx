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
import { BackButton } from "../components/BackButton";
import { ConsentCheck } from "../components/ConsentCheck";
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
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const entrance = useSectionEntrance(2);

  // The privacy policy lives on the root stack, so it can also be opened
  // before the user has an account.
  const openPrivacyPolicy = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate("PrivacyPolicy");
  };

  const submit = async () => {
    if (!agreed) {
      setError("Please agree to the Privacy Policy to continue.");
      return;
    }
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
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AmbientBackground />

        <Animated.View style={[styles.brand, entrance(0)]}>
          <BackButton onPress={() => navigation.goBack()} label="Back to sign in" />
          <AppLogo size={52} />
        </Animated.View>

        <Animated.View style={[styles.panel, entrance(1)]}>
          <PageTitle
            title="Create account"
            subtitle="Set up your wearable health profile."
          />
          <View style={{ height: spacing.lg }} />

          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
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
            helper="Stored hashed on the server �? never logged or shared."
          />

          <ConsentCheck checked={consent} onToggle={() => setConsent((c) => !c)}>
            I consent to health-data processing for risk estimation.
          </ConsentCheck>

          <ConsentCheck
            checked={agreed}
            onToggle={() => setAgreed((a) => !a)}
            link={{ label: "Privacy Policy", onPress: openPrivacyPolicy }}
          >
            I agree to the terms of use and the
          </ConsentCheck>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title="Create account"
            onPress={() => void submit()}
            loading={busy}
          />
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: themeNew.background },
  content: { padding: spacing.xl, flexGrow: 1, justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: spacing.base, gap: spacing.sm },
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
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
});
