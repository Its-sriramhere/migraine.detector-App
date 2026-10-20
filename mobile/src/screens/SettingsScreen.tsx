import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const KEY = "mg_preferences_v1";

interface Prefs {
  demoByDefault: boolean;
  showExplanation: boolean;
  emailOnHighRisk: boolean;
}

const DEFAULT_PREFS: Prefs = {
  demoByDefault: true,
  showExplanation: true,
  emailOnHighRisk: false,
};

export function SettingsScreen(_: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => undefined);
  }, []);

  const update = (key: keyof Prefs, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const save = async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const rows: { key: keyof Prefs; label: string; hint: string }[] = [
    {
      key: "demoByDefault",
      label: "Enable demo mode by default",
      hint: "Start the monitoring screen in Demo Mode.",
    },
    {
      key: "showExplanation",
      label: "Show risk explanation on alerts",
      hint: "Display contributing factors inside each alert.",
    },
    {
      key: "emailOnHighRisk",
      label: "Email me on high-risk estimates",
      hint: "Prototype preference — stored locally on this device.",
    },
  ];

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Settings</Text>
      <Card>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <Text style={styles.sub}>{user?.email ?? "—"}</Text>
        <Text style={styles.sub}>
          Consent: {user?.consent_given ? "Given" : "Not given"}
        </Text>
        {user?.created_at ? (
          <Text style={styles.sub}>
            Member since {new Date(user.created_at).toLocaleDateString()}
          </Text>
        ) : null}
      </Card>

      <Text style={styles.section}>Preferences</Text>
      <Card>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowHint}>{row.hint}</Text>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={(v) => update(row.key, v)}
              accessibilityLabel={row.label}
            />
          </View>
        ))}
      </Card>
      <Button title="Save preferences" onPress={() => void save()} />
      {saved ? <Text style={styles.saved}>Preferences saved.</Text> : null}
      <Text style={styles.note}>
        Preferences are stored locally on this device in this prototype.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  section: { ...typography.h2, color: colors.textPrimary },
  name: { ...typography.h2, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.textPrimary, fontWeight: "600" },
  rowHint: { ...typography.caption, color: colors.textTertiary },
  saved: { ...typography.bodySmall, color: colors.success, textAlign: "center" },
  note: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
