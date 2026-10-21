/**
 * A tiny bus so any screen can open the Mira overlay with a topic.
 *
 * The overlay is a native modal hosted above every screen by MiraHost, so
 * there is no navigation route to jump to. Instead a screen calls
 * `openMira("status")` and the host opens the chat with that topic already
 * selected.
 */

export type MiraTopic = string | null;

type Listener = (topic: MiraTopic) => void;

let listener: Listener | null = null;

export function setMiraListener(next: Listener | null) {
  listener = next;
}

/** Open the Mira overlay, optionally pre-selecting a topic. */
export function openMira(topic: MiraTopic = null) {
  listener?.(topic);
}
