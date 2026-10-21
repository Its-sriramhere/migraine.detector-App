import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppHeader } from "../components/AppHeader";
import { Input } from "../components/Input";
import { PrimaryButton } from "../components/PrimaryButton";
import { config, normalizeBackendUrl, saveBackendUrl } from "../constants/config";
import { colors } from "../constants/colors";
import { clearToken } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { RootStackParamList } from "../navigation/types";

export function BackendScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Backend">) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [address, setAddress] = useState(config.apiBaseUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const check = async () => {
    const base = normalizeBackendUrl(address);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const result = await fetch(`${base}/chat/status`, { signal: controller.signal });
      const status = await result.json();
      if (!result.ok || status.guide !== true) throw new Error("This address is not the Migraine Detector backend.");
      return base;
    } finally { clearTimeout(timeout); }
  };
  const run = async (save: boolean) => {
    setBusy(true); setMessage("");
    try {
      const base = await check();
      if (save) {
        // Do not forward the previous server's session to a different host.
        await clearToken();
        await saveBackendUrl(base);
        await refreshUser();
        if (!user && navigation.canGoBack()) navigation.goBack();
      } else setMessage("Connected successfully to the Migraine Detector backend.");
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "AbortError" ? error.message : "Connection timed out. Use the computer's LAN IP and keep both devices on the same Wi-Fi.");
    } finally { setBusy(false); }
  };
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <AppHeader title="Backend connection" onBack={() => navigation.goBack()} />
      <Text style={styles.body}>{"Point the app at a Migraine Detector backend. Use the public HTTPS address of the deployed API to connect over cellular data from anywhere, or your computer's LAN address (for example http://<your-computer-ip>:8000/api) to test on the same Wi-Fi."}</Text>
      <Input label="Backend API address" value={address} onChangeText={setAddress} autoCapitalize="none" placeholder="https://your-api.onrender.com/api" />
      <PrimaryButton title="Test connection" variant="secondary" loading={busy} onPress={() => void run(false)} />
      <PrimaryButton title="Save and sign in" loading={busy} onPress={() => void run(true)} />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 20 },
  body: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
});
