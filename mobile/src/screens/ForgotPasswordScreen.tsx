import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.sub}>
        Password reset is handled by the backend team in this MVP. Please
        contact support or use the website flow linked in your onboarding
        email.
      </Text>
      <View style={{ height: spacing.base }} />
      <Button title="Back to Sign In" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 8 },
});
