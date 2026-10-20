import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <Text style={styles.title}>Profile</Text>
      <Card>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <Text style={styles.sub}>{user?.email ?? "—"}</Text>
        <Text style={styles.sub}>
          Consent: {user?.consent_given ? "given" : "not given"}
        </Text>
      </Card>
      <View style={styles.gap} />
      <Button title="Sign Out" variant="secondary" onPress={() => void signOut()} />
      <Text style={styles.note}>
        Research prototype — predictions are risk estimates, not medical
        diagnoses.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  name: { ...typography.h2, color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  gap: { height: spacing.base },
  note: { color: colors.textTertiary, fontSize: 12, marginTop: 8 },
});
