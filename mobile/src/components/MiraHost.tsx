import { useState } from "react";
import { MiraChatOverlay } from "./MiraChatOverlay";
import { MiraFab } from "./MiraFab";

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

  return (
    <>
      <MiraFab onPress={() => setOpen(true)} bottom={bottom} />
      <MiraChatOverlay
        visible={open}
        onClose={() => setOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}
