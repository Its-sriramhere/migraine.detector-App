import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyPolicy">;

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, email address, the answers you give in the health assessment, the sensor readings your wearable sends, and the migraine episodes you log. Readings include heart rate, HRV, blood pressure, SpO₂, temperature and activity.",
  },
  {
    title: "Why we collect it",
    body: "To build your personal baseline, estimate a migraine risk score, show trends and history, and raise alerts you have asked for. The risk score compares your readings with your own normal range, not with other people.",
  },
  {
    title: "Your password",
    body: "Your password is hashed on the server before it is stored. It is never logged, never emailed and never shared with anyone, including us.",
  },
  {
    title: "Who can see your data",
    body: "Only you. Readings are stored against your own account and are not sold, rented or shared with advertisers or data brokers.",
  },
  {
    title: "Wearable data and permissions",
    body: "Bluetooth access is used only to read your wearable and to write a haptic alert back to it. You can revoke the connection from your phone's settings at any time, and the app falls back to a simulated wearable when it is not connected.",
  },
  {
    title: "How long we keep it",
    body: "Readings, predictions and logged episodes are kept until you delete your account. Removing the account deletes the readings and episodes that belong to it.",
  },
  {
    title: "Not a medical device",
    body: "Migraine Detector is a research prototype. It estimates risk and explains what changed; it does not diagnose migraine, and it does not decide treatment. Follow the care plan your clinician has given you.",
  },
  {
    title: "Your choices",
    body: "You can review and edit your profile, change notification preferences, export your data, and close your account from Profile & Settings at any time.",
  },
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxl },
      ]}
    >
      <AppHeader title="Privacy Policy" onBack={() => navigation.goBack()} />

      <Text style={styles.lead}>
        This explains what Migraine Detector stores on your device and on the
        server, and what it never does with it.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Questions about your data? Raise a support request from Profile &
          Settings, or write to the project maintainer.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, gap: spacing.base },
  lead: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: { gap: 4 },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  note: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
