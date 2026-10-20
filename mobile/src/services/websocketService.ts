import { config } from "../constants/config";
import type { WsEvent } from "../types";
import { getToken } from "./api";

export interface WsClient {
  send: (data: unknown) => void;
  close: () => void;
}

export function wsUrl(userId: number, token: string): string {
  return `${config.wsBaseUrl}/ws/${userId}?token=${encodeURIComponent(token)}`;
}

/**
 * Opens a WebSocket to the backend and reconnects with backoff on failure.
 * Ported from the web client so live `prediction_update` / `alert_update`
 * events behave identically on mobile.
 */
export function openWebSocket(
  userId: number,
  onEvent: (event: WsEvent) => void,
  onStatus?: (connected: boolean) => void,
): WsClient {
  let socket: WebSocket | null = null;
  let closed = false;
  let retries = 0;
  let token = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReconnect = () => {
    if (closed) return;
    const delay = Math.min(15000, 1000 * 2 ** retries);
    retries += 1;
    timer = setTimeout(connect, delay);
  };

  const connect = async () => {
    if (closed) return;
    if (!token) {
      token = (await getToken()) ?? "";
      if (!token) {
        scheduleReconnect();
        return;
      }
    }
    try {
      socket = new WebSocket(wsUrl(userId, token));
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      retries = 0;
      onStatus?.(true);
    };

    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(String(message.data));
        onEvent(data as WsEvent);
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      onStatus?.(false);
      if (!closed) scheduleReconnect();
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  void connect();

  return {
    send: (data) => {
      if (socket && socket.readyState === 1 /* OPEN */) {
        socket.send(JSON.stringify(data));
      }
    },
    close: () => {
      closed = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    },
  };
}
