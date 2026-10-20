import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import type { BaselineEstimates, RiskProfile } from "../types";
import * as userService from "../services/userService";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{label}</Text>
      <Text style={styles.rowValue}>
        {value === undefined || value === "" ? "—" : String(value)}
      </Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [baseline, setBaseline] = useState<BaselineEstimates | null>(null);

  useEffect(() => {
    userService.getRiskProfile().then(setProfile).catch(() => undefined);
    userService.getBaseline().then(setBaseline).catch(() => undefined);
  }, []);

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

      <Text style={styles.section}>Personalization profile</Text>
      {profile ? (
        <Card>
          <Row label="Migraine history score" value={profile.migraine_history_score} />
          <Row label="Sleep profile" value={profile.sleep_profile} />
          <Row label="Stress profile" value={profile.stress_profile} />
          <Row label="Activity profile" value={profile.activity_profile} />
          <Row label="Hydration profile" value={profile.hydration_profile} />
          <Row label="Caffeine profile" value={profile.caffeine_profile} />
          <Row label="Resting HR" value={profile.resting_hr} />
          <Row label="Profile version" value={profile.profile_version} />
          {profile.trigger_profile?.length ? (
            <>
              <Text style={styles.triggerLabel}>Known triggers</Text>
              <View style={styles.chips}>
                {profile.trigger_profile.map((t) => (
                  <Chip key={t} label={t} selected />
                ))}
              </View>
            </>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text style={styles.sub}>
            No personal baseline yet. Take the assessment so the model can
            compare your readings against your own normal.
          </Text>
          <Button
            title="Take the assessment"
            onPress={() => navigation.navigate("Assessment")}
          />
        </Card>
      )}

      <Text style={styles.section}>Personal baseline</Text>
      {baseline ? (
        <Card>
          <Row
            label="Resting heart rate"
            value={`${baseline.heart_rate_low}–${baseline.heart_rate_high} BPM`}
          />
          <Row label="Sleep hours" value={baseline.sleep_hours} />
          <Text style={styles.note}>{baseline.resting_note}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.sub}>Baseline unavailable.</Text>
        </Card>
      )}

      <Text style={styles.section}>Manage</Text>
      <Card>
        <View style={styles.linkRow}>
          <Button
            title="Take / retake assessment"
            variant="secondary"
            onPress={() => navigation.navigate("Assessment")}
          />
        </View>
        <View style={styles.linkRow}>
          <Button
            title="Raspberry Pi devices"
            variant="secondary"
            onPress={() => navigation.navigate("Device")}
          />
        </View>
        <View style={styles.linkRow}>
          <Button
            title="Reports"
            variant="secondary"
            onPress={() => navigation.navigate("Reports")}
          />
        </View>
        <View style={styles.linkRow}>
          <Button
            title="Datasets & thresholds"
            variant="secondary"
            onPress={() => navigation.navigate("Datasets")}
          />
        </View>
        <View style={styles.linkRow}>
          <Button
            title="Settings"
            variant="secondary"
            onPress={() => navigation.navigate("Settings")}
          />
        </View>
      </Card>

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
  content: { padding: spacing.base, gap: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary },
  section: { ...typography.h2, color: colors.textPrimary },
  name: { ...typography.h2, color: colors.textPrimary },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  rowKey: { ...typography.bodySmall, color: colors.textSecondary },
  rowValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "600" },
  triggerLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  linkRow: { marginBottom: spacing.sm },
  note: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
