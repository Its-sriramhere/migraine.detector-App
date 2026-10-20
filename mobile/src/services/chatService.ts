import { api } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  topicId?: string | null;
}

export interface ChatReply {
  reply: string;
  mode: "demo" | "guide" | "safety" | "ai";
  topicId?: string | null;
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
}

export interface ChatStatus {
  mode: string;
  guide: boolean;
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

export function sendChat(
  messages: ChatMessage[],
  options?: {
    topicId?: string | null;
    shareMetrics?: boolean;
    wearableData?: WearableShare | null;
  },
) {
  return api.post<ChatReply>("/chat", {
    messages: messages.slice(-10),
    ...(options?.topicId ? { topicId: options.topicId } : {}),
    ...(options?.shareMetrics && options.wearableData
      ? { shareMetrics: true, wearableData: options.wearableData }
      : {}),
  });
}
