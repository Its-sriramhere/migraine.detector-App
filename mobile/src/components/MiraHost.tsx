import { useEffect, useRef, useState } from "react";
import { MiraChatOverlay } from "./MiraChatOverlay";
import { MiraFab } from "./MiraFab";
import { setMiraListener } from "../services/miraBus";

/**
 * Hosts the Mira floating button and its chat overlay.
 *
 * The overlay is a native modal, so it renders above every screen. The
 * button floats above the bottom navigation, the way the Figma frames show
 * it.
 */
export function MiraHost({
  onNavigate,
  bottom = 92,
}: {
  onNavigate?: (route: string) => void;
  /** Distance from the bottom of the screen. */
  bottom?: number;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const pending = useRef<string | null>(null);

  useEffect(() => {
    setMiraListener((next) => {
      pending.current = next;
      setTopic(next);
      setOpen(true);
    });
    return () => setMiraListener(null);
  }, []);

  return (
    <>
      <MiraFab onPress={() => setOpen(true)} bottom={bottom} />
      <MiraChatOverlay
        visible={open}
        topicId={topic}
        onClose={() => setOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}
