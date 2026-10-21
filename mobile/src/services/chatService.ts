import { api } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  topicId?: string | null;
  /** The playbook's safety tier for this reply. */
  safetyLevel?: string;
  /** Up to three tappable suggestions for the next message. */
  quickReplies?: QuickReply[];
}

/** A tappable suggestion for the next message. */
export interface QuickReply {
  id: string;
  label: string;
}

/** Something the client can offer, e.g. saving an episode. */
export interface UiAction {
  type: string;
  label: string;
  payload?: Record<string, unknown>;
}

/** A knowledge card that backed a reply. */
export interface ChatCard {
  card_id: string;
  title: string;
  body: string;
  category: string;
  version: string;
  review_status: string;
}

export interface ChatReply {
  reply: string;
  mode: "demo" | "guide" | "safety" | "ai";
  topicId?: string | null;
  conversationId?: string;
  intent?: string;
  safetyLevel?: string;
  contentVersion?: string;
  quickReplies?: QuickReply[];
  uiActions?: UiAction[];
  requiresConfirmation?: boolean;
  medicalDataUsed?: boolean;
  cards?: ChatCard[];
}

export interface ChatFeature {
  id: string;
  icon: string;
  title: string;
  short_title: string;
  route: string;
  summary: string;
  see: string;
  steps: string[];
  note: string;
}

export interface ChatGuide {
  features: ChatFeature[];
  tour_ids: string[];
  questions: { title: string; topic_id: string; question: string }[];
  health_prompts: string[];
  cards?: ChatCard[];
  content_version?: string;
}

export interface ChatStatus {
  mode: string;
  guide: boolean;
  content_version?: string;
  review_status?: string;
}

/** Numeric wearable fields the user may opt in to share. */
export interface WearableShare {
  sleepHours?: number;
  hrvMs?: number;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
}

export function getChatStatus() {
  return api.get<ChatStatus>("/chat/status");
}

export function getChatGuide() {
  return api.get<ChatGuide>("/chat/guide");
}

export async function sendChat(
  messages: ChatMessage[],
  options?: {
    topicId?: string | null;
    shareMetrics?: boolean;
    wearableData?: WearableShare | null;
  },
) {
  const response = await api.post<ChatReply & { topic_id?: string | null }>("/chat", {
    messages: messages.slice(-10).map(({ role, content }) => ({ role, content })),
    ...(options?.topicId ? { topicId: options.topicId } : {}),
    ...(options?.shareMetrics && options.wearableData
      ? { shareMetrics: true, wearableData: options.wearableData }
      : {}),
  });
  return { ...response, topicId: response.topic_id ?? response.topicId ?? null };
}
