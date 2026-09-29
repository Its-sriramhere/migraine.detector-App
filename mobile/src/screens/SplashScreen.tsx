import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const id = setTimeout(() => navigation.replace("Login"), 800);
    return () => clearTimeout(id);
  }, [navigation]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Migraine Detector</Text>
      <Text style={styles.sub}>Predicted risk monitoring, explained.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { ...typography.display, color: colors.textPrimary },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 8 },
});
