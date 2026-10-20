import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrainArt } from "../components/BrainArt";
import { colors } from "../constants/colors";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import type { RootStackParamList } from "../navigation/types";
import { hasSeenOnboarding } from "../services/onboardingService";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

/**
 * Branded boot screen. It decides where the app opens:
 *   signed out        -> the auth stack
 *   signed in, first run -> onboarding
 *   signed in, returning  -> the main tabs
 */
export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const id = setTimeout(async () => {
      if (cancelled) return;

      // The navigator is keyed on the session, so only one of these routes
      // is ever registered. Guard anyway so a stale session cannot throw.
      const available = navigation.getState().routeNames;

      if (!user) {
        navigation.replace(available.includes("Auth") ? "Auth" : "Main");
        return;
      }

      const seen = await hasSeenOnboarding();
      if (cancelled) return;

      const target = seen ? "Main" : "Onboarding";
      navigation.replace(available.includes(target) ? target : "Main");
    }, 1600);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [navigation, user]);

  return (
    <LinearGradient
      colors={[colors.splashTop, colors.splashBottom]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.wrap}
    >
      <View
        style={[styles.blob, { top: -120, right: -140, width: 420, height: 420 }]}
        pointerEvents="none"
      />
      <View
        style={[styles.blob, { bottom: -160, left: -170, width: 460, height: 460 }]}
        pointerEvents="none"
      />

      <View style={[styles.art, { marginTop: insets.top + 80 }]}>
        <BrainArt size={272} />
      </View>

      <View style={[styles.copy, { paddingBottom: insets.bottom + 48 }]}>
        <Text style={styles.title}>Migraine{`\n`}Detection</Text>
        <Text style={styles.tagline}>Predict. Prevent. Live Better.</Text>
        <View style={styles.progress}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.splashTop },
  blob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: colors.splashShape,
    opacity: 0.55,
  },
  art: { alignItems: "center" },
  copy: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 10 },
  title: {
    ...typography.display,
    color: "#FFFFFF",
    textAlign: "center",
  },
  tagline: { ...typography.body, color: "#C7D8F0" },
  progress: {
    width: 80,
    height: 4,
    borderRadius: radius.bar,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: 4,
    borderRadius: radius.bar,
    backgroundColor: colors.splashInk,
  },
});
