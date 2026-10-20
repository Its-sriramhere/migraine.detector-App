import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SensorDetails">;

export function SensorDetailsScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + spacing.base }]}
    >
      <Text style={styles.title}>{route.params.name}</Text>
      <Text style={styles.sub}>
        Detailed trend charts land in Phase 2. Values on the Monitoring tab
        come from the backend (`/api/sensor/history`).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { color: colors.textSecondary, marginTop: 8 },
});
