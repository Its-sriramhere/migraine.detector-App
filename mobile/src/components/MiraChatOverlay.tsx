import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Sparkle, X } from "lucide-react-native";
import { themeNew } from "../constants/colors";
import { radius } from "../constants/radius";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { TypingDots } from "./TypingDots";
import { MiraMark } from "./MiraMark";
import type {
  ChatFeature,
  ChatGuide,
  ChatMessage,
  ChatReply,
} from "../services/chatService";
import { getChatGuide, sendChat } from "../services/chatService";

const GREETING =
  "Hi! I'm Mira 👋 I can explain app features, guide you through every screen, or share general migraine wellness tips.";

/** Shortest time the typing indicator is shown before the reply appears. */
const MIN_THINKING_MS = 900;

export interface MiraChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  /** Route names the app can navigate to, used by the guide buttons. */
  onNavigate?: (route: string) => void;
}

export function MiraChatOverlay({
  visible,
  onClose,
  onNavigate,
}: MiraChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<ChatGuide | null>(null);
  const [browse, setBrowse] = useState<"app" | "health">("app");
  const [tourStep, setTourStep] = useState(-1);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible || guide) return;
    getChatGuide()
      .then(setGuide)
      .catch(() => undefined);
  }, [visible, guide]);

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, busy, visible]);

  const send = async (question: string = draft, topicId?: string) => {
    const text = question.trim().slice(0, 1000);
    if (!text || busy) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(next);
    setDraft("");
    setError(null);
    setBusy(true);

    // The guide answers cached questions instantly. Hold the reply back for a
    // beat so the typing indicator is seen and the answer feels considered.
    const startedAt = Date.now();

    try {
      const reply: ChatReply = await sendChat(next, { topicId });
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_THINKING_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_THINKING_MS - elapsed),
        );
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply.reply,
          topicId: reply.topicId ?? null,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to reach Mira. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const tourFeature: ChatFeature | undefined =
    tourStep >= 0 && guide
      ? guide.features.find((f) => f.id === guide.tour_ids[tourStep])
      : undefined;

  const goTo = (feature: ChatFeature) => {
    if (onNavigate) onNavigate(feature.route);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheet}
        pointerEvents="box-none"
      >
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <MiraMark size={44} />
            </View>
            <View style={styles.heading}>
              <Text style={styles.headingTitle}>Mira Assistant</Text>
              <View style={styles.presenceRow}>
                <View style={styles.presenceDot} />
                <Text style={styles.presence}>Online · App guide & health tips</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chat"
              onPress={onClose}
              style={styles.close}
            >
              <X size={18} color={themeNew.miraPrimary} strokeWidth={2.6} />
            </Pressable>
          </View>

          {/* Guided tour */}
          {tourFeature ? (
            <View style={styles.tour}>
              <View style={styles.tourHead}>
                <Text style={styles.tourLabel}>GUIDED APP TOUR</Text>
                <Pressable onPress={() => setTourStep(-1)}>
                  <Text style={styles.tourEnd}>End ×</Text>
                </Pressable>
              </View>
              <View style={styles.tourProgress}>
                {guide?.tour_ids.map((id, index) => (
                  <View
                    key={id}
                    style={[
                      styles.tourStep,
                      index <= tourStep && styles.tourStepFilled,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.tourTitle}>
                {tourStep + 1}/{guide?.tour_ids.length} · {tourFeature.title}
              </Text>
              <Text style={styles.tourBody}>{tourFeature.summary}</Text>
              <View style={styles.tourInstruction}>
                <Text style={styles.tourInstructionText}>
                  First step: {tourFeature.steps[0]}
                </Text>
              </View>
              <View style={styles.tourActions}>
                <Pressable
                  disabled={tourStep === 0}
                  onPress={() => setTourStep((i) => i - 1)}
                  style={[
                    styles.tourButton,
                    tourStep === 0 && styles.tourButtonDisabled,
                  ]}
                >
                  <Text style={styles.tourButtonText}>← Back</Text>
                </Pressable>
                {onNavigate ? (
                  <Pressable
                    onPress={() => goTo(tourFeature)}
                    style={styles.tourButton}
                  >
                    <Text style={styles.tourButtonText}>Open screen ↗</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() =>
                    tourStep < (guide?.tour_ids.length ?? 1) - 1
                      ? setTourStep((i) => i + 1)
                      : setTourStep(-1)
                  }
                  style={[styles.tourButton, styles.tourButtonNext]}
                >
                  <Text style={[styles.tourButtonText, styles.tourButtonNextText]}>
                    {tourStep < (guide?.tour_ids.length ?? 1) - 1
                      ? "Next →"
                      : "Finish ✓"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.date}>TODAY</Text>
            {messages.map((m, i) => {
              const feature = m.topicId
                ? guide?.features.find((f) => f.id === m.topicId)
                : undefined;
              return (
                <View
                  key={i}
                  style={[
                    styles.message,
                    m.role === "user" && styles.messageUser,
                  ]}
                >
                  {m.role === "assistant" ? (
                    <View style={styles.miniAvatar}>
                      <MiraMark size={26} />
                    </View>
                  ) : null}
                  <View style={styles.bubbleWrap}>
                    <View
                      style={[
                        styles.bubble,
                        m.role === "user"
                          ? styles.bubbleUser
                          : styles.bubbleAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          m.role === "user" && styles.bubbleTextUser,
                        ]}
                      >
                        {m.content}
                      </Text>
                    </View>
                    {feature && onNavigate ? (
                      <Pressable
                        onPress={() => goTo(feature)}
                        style={styles.inlineNav}
                      >
                        <Text style={styles.inlineNavText}>
                          Go to {feature.short_title} ↗
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
            {busy ? (
              <View style={styles.message}>
                <View style={styles.miniAvatar}>
                  <MiraMark size={26} />
                </View>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            ) : null}
            {error ? (
              <Pressable onPress={() => setError(null)} style={styles.error}>
                <Text style={styles.errorText}>{error} · Dismiss</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.switcher}>
              <Pressable
                onPress={() => setBrowse("app")}
                style={[
                  styles.switch,
                  browse === "app" && styles.switchActive,
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    browse === "app" && styles.switchTextActive,
                  ]}
                >
                  Explore the app
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBrowse("health")}
                style={[
                  styles.switch,
                  browse === "health" && styles.switchActive,
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    browse === "health" && styles.switchTextActive,
                  ]}
                >
                  Health tips
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setTourStep(0);
                  setBrowse("app");
                }}
                style={[styles.switch, styles.switchTour]}
              >
                <Text style={[styles.switchText, styles.switchTourText]}>
                  Start app tour →
                </Text>
              </Pressable>
            </View>

            {browse === "app" ? (
              <View style={styles.topicGrid}>
                {guide?.features.slice(0, 9).map((f) => (
                  <Pressable
                    key={f.id}
                    disabled={busy}
                    onPress={() => send(`Explain ${f.title} and guide me through it.`, f.id)}
                    style={styles.topic}
                  >
                    <Text style={styles.topicText}>{f.short_title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.promptRow}>
                {(guide?.health_prompts ?? []).map((q) => (
                  <Pressable
                    key={q}
                    disabled={busy}
                    onPress={() => send(q)}
                    style={styles.prompt}
                  >
                    <Text style={styles.promptText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.form}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask Mira anything..."
                placeholderTextColor={themeNew.miraDate}
                style={styles.input}
                maxLength={1000}
                editable={!busy}
                returnKeyType="send"
                onSubmitEditing={() => void send()}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                disabled={busy || !draft.trim()}
                onPress={() => void send()}
                style={[
                  styles.send,
                  (busy || !draft.trim()) && styles.sendDisabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" strokeWidth={2.2} />
                )}
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>
              General information only · Not medical advice
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: themeNew.miraDim,
    opacity: 0.55,
  },
  sheet: { flex: 1, justifyContent: "flex-end" },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "86%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: themeNew.miraPrimary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: themeNew.miraAvatar,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { flex: 1, gap: 2 },
  headingTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  presenceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  presenceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: themeNew.miraOnline,
  },
  presence: {
    ...typography.micro,
    color: themeNew.miraPresence,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  tour: {
    backgroundColor: themeNew.purpleTint,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: 6,
  },
  tourHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tourLabel: {
    ...typography.microStrong,
    fontSize: 9,
    letterSpacing: 0.8,
    color: themeNew.purpleText,
  },
  tourEnd: {
    ...typography.microStrong,
    color: themeNew.purpleText,
  },
  tourProgress: { flexDirection: "row", gap: 3 },
  tourStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D3DEF4",
  },
  tourStepFilled: { backgroundColor: themeNew.primary },
  tourTitle: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: themeNew.textPrimary,
  },
  tourBody: {
    ...typography.micro,
    color: themeNew.textSecondary,
  },
  tourInstruction: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  tourInstructionText: {
    ...typography.micro,
    color: themeNew.textPrimary,
  },
  tourActions: { flexDirection: "row", justifyContent: "flex-end", gap: 6 },
  tourButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: themeNew.border,
  },
  tourButtonDisabled: { opacity: 0.45 },
  tourButtonNext: { backgroundColor: themeNew.primary, borderColor: themeNew.primary },
  tourButtonText: {
    ...typography.micro,
    fontWeight: "700",
    color: themeNew.primary,
  },
  tourButtonNextText: { color: "#FFFFFF" },
  body: { flex: 1, minHeight: 0 },
  bodyContent: {
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: "#FBFDFF",
  },
  date: {
    ...typography.microStrong,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: "center",
    color: themeNew.textTertiary,
  },
  message: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  messageUser: { justifyContent: "flex-end" },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: themeNew.blueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleWrap: { flexShrink: 1, maxWidth: "84%" },
  bubble: { borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11 },
  bubbleAssistant: { backgroundColor: themeNew.miraBubble },
  bubbleUser: { backgroundColor: themeNew.miraUserBubble },
  bubbleText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 19,
    color: themeNew.textPrimary,
  },
  bubbleTextUser: { color: "#FFFFFF" },
  inlineNav: {
    marginTop: 5,
    alignSelf: "flex-start",
    backgroundColor: themeNew.blueTint,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  inlineNavText: {
    ...typography.micro,
    fontWeight: "700",
    color: themeNew.primary,
  },
  thinking: {
    ...typography.caption,
    color: themeNew.miraDate,
  },
  typingBubble: {
    backgroundColor: themeNew.miraBubble,
    borderRadius: 15,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  error: {
    backgroundColor: "#FFF1F1",
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    ...typography.micro,
    color: "#A43A3A",
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: themeNew.border,
    gap: spacing.sm,
  },
  switcher: { flexDirection: "row", gap: 5 },
  switch: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F0F4FC",
    alignItems: "center",
  },
  switchActive: { backgroundColor: themeNew.blueTint },
  switchTour: { backgroundColor: themeNew.primary, flex: 1.05 },
  switchText: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: "700",
    color: themeNew.textSecondary,
  },
  switchTextActive: { color: themeNew.primary },
  switchTourText: { color: "#FFFFFF" },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  topic: {
    flexBasis: "31%",
    flexGrow: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: themeNew.border,
    backgroundColor: "#F8FBFF",
    alignItems: "center",
  },
  topicText: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: "600",
    color: themeNew.textPrimary,
  },
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  prompt: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeNew.border,
    backgroundColor: "#F5F9FF",
  },
  promptText: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: "600",
    color: themeNew.primary,
  },
  form: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 5,
    paddingLeft: spacing.md,
    backgroundColor: "#F6F9FE",
    borderWidth: 1,
    borderColor: themeNew.miraComposerStroke,
    borderRadius: 22,
  },
  input: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    color: themeNew.textPrimary,
    paddingVertical: 8,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: themeNew.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  disclaimer: {
    ...typography.micro,
    fontSize: 9,
    textAlign: "center",
    color: themeNew.miraDate,
  },
});
