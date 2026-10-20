import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  Database,
  FileText,
  Heart,
  HelpCircle,
  User,
} from "lucide-react-native";
import { TabBackButton } from "../components/TabBackButton";
import { AppLogo } from "../components/AppLogo";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { MenuRow } from "../components/MenuRow";
import { PageTitle } from "../components/PageTitle";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
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

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [baseline, setBaseline] = useState<BaselineEstimates | null>(null);

  useEffect(() => {
    userService.getRiskProfile().then(setProfile).catch(() => undefined);
    userService.getBaseline().then(setBaseline).catch(() => undefined);
  }, []);

  const initial = (user?.name?.[0] ?? "?").toUpperCase();

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.base },
      ]}
    >
      <View style={styles.brandRow}>
        <AppLogo size={40} />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>Migraine Detector</Text>
          <Text style={styles.brandSub}>Wearable-powered health companion</Text>
        </View>
        <TabBackButton onPress={() => navigation.navigate("Home")} />
      </View>

      <PageTitle title="Profile & Settings" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open wearable connection"
        onPress={() => navigation.navigate("Watch")}
        style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
      >
        <Card style={styles.profileCard}>
          <IconCircle size={92} background={colors.blueTint} color={colors.primary}>
            <Text style={styles.avatar}>{initial}</Text>
          </IconCircle>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name ?? "—"}</Text>
            <Text style={styles.profileSub}>Wearable health profile</Text>
            <Text style={styles.profileLink}>Wearable connection →</Text>
          </View>
        </Card>
      </Pressable>

      <MenuRow
        icon={<User size={20} color={colors.primary} />}
        title="Personal information"
        subtitle="Name and health preferences"
        onPress={() => navigation.navigate("Assessment")}
      />
      <MenuRow
        icon={<FileText size={20} color={colors.primary} />}
        title="Migraine history"
        subtitle="Log episodes and identify patterns"
        onPress={() => navigation.navigate("Symptoms" as never)}
      />
      <MenuRow
        icon={<Heart size={20} color={colors.primary} />}
        title="Medication notes"
        subtitle="Personal care information"
        onPress={() => navigation.navigate("Settings")}
      />
      <MenuRow
        icon={<Bell size={20} color={colors.primary} />}
        title="Notifications"
        subtitle="Customize reminders and alerts"
        onPress={() => navigation.navigate("Settings")}
      />
      <MenuRow
        icon={<Database size={20} color={colors.primary} />}
        title="Data & privacy"
        subtitle="Control permissions and exports"
        onPress={() => navigation.navigate("Reports")}
      />
      <MenuRow
        icon={<HelpCircle size={20} color={colors.primary} />}
        title="Help and support"
        subtitle="FAQs and contact details"
        onPress={() => navigation.navigate("Settings")}
      />

      {profile || baseline ? (
        <Card>
          <Text style={styles.cardTitle}>Your baseline</Text>
          {baseline ? (
            <Text style={styles.cardLine}>
              Resting heart rate {baseline.heart_rate_low}–
              {baseline.heart_rate_high} BPM
            </Text>
          ) : null}
          {profile?.resting_hr ? (
            <Text style={styles.cardLine}>
              Resting heart rate {profile.resting_hr} BPM
            </Text>
          ) : null}
          {profile?.sleep_profile ? (
            <Text style={styles.cardLine}>Sleep: {profile.sleep_profile}</Text>
          ) : null}
          {profile?.stress_profile ? (
            <Text style={styles.cardLine}>Stress: {profile.stress_profile}</Text>
          ) : null}
          {profile?.trigger_profile?.length ? (
            <Text style={styles.cardLine}>
              Triggers: {profile.trigger_profile.join(", ")}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <PrimaryButton title="Sign out" variant="danger" onPress={() => void signOut()} />
      <Text style={styles.note}>
        Research prototype — predictions are risk estimates, not medical
        diagnoses.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.md },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  brandText: { flex: 1, gap: 2 },
  brandName: {
    ...typography.rowTitle,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  brandSub: {
    ...typography.micro,
    color: colors.textSecondary,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    borderRadius: radius.card,
  },
  avatar: { fontSize: 34, fontWeight: "700", color: colors.primary },
  profileText: { flex: 1, gap: 1 },
  profileName: { ...typography.headerTitle, color: colors.textPrimary },
  profileSub: { ...typography.bodySmall, color: colors.textSecondary },
  profileLink: { ...typography.caption, color: colors.primary, marginTop: 4 },
  cardTitle: { ...typography.section, color: colors.textPrimary },
  cardLine: { ...typography.bodySmall, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textTertiary, textAlign: "center" },
});
