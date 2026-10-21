import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppHeader } from "../components/AppHeader";
import { AmbientBackground } from "../components/AmbientBackground";
import { Input } from "../components/Input";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../constants/colors";
import { api } from "../services/api";
import type { Alert, RiskLevel } from "../types";
import type { RootStackParamList } from "../navigation/types";

export function DeveloperScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Developer">) {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("Testing the migraine alert flow");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => { api.get<{ enabled: boolean }>("/developer/status").then((s) => setEnabled(s.enabled)).catch(() => setEnabled(false)); }, []);
  const send = async (level: RiskLevel) => {
    setBusy(true); setResult("");
    try {
      const alert = await api.post<Alert>("/developer/alerts", { level, message });
      setResult(`Test alert #${alert.id} saved (${level}). Open Insights & Alerts to review it.`);
    } catch (e) { setResult(e instanceof Error ? e.message : "Test alert failed"); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
      <AmbientBackground />
      <AppHeader title="Developer testing" onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Manual alert console</Text>
      <Text style={styles.body}>Send labelled test alerts to this developer account. They appear in the existing alert list and websocket stream. Live predictions stay unchanged; no SMS is sent.</Text>
      {!enabled ? <Text style={styles.body}>Sign in with the provisioned developer account to use these controls.</Text> : (
        <View style={styles.actions}>
          <Input label="Test message" value={message} onChangeText={setMessage} />
          {(["low", "moderate", "high"] as const).map((level) => <PrimaryButton key={level} title={`Send ${level}-risk test alert`} loading={busy} disabled={!message.trim()} onPress={() => void send(level)} />)}
          <PrimaryButton title="View alerts" variant="secondary" onPress={() => navigation.navigate("Alerts")} />
        </View>
      )}
      {result ? <Text accessibilityLiveRegion="polite" style={styles.result}>{result}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 20 },
  title: { fontSize: 26, fontWeight: "700", color: colors.textPrimary },
  body: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  actions: { gap: 12 },
  result: { fontSize: 14, lineHeight: 22, color: colors.primary, padding: 16, borderRadius: 16, backgroundColor: colors.primaryLight },
});
