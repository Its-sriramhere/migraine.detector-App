/**
 * Layout metrics that more than one screen needs.
 */

/**
 * Height of the custom bottom tab bar, excluding the safe-area inset.
 * Mirrors `CenteredTabBar` (row + labels + centred action button).
 */
export const TAB_BAR_HEIGHT = 92;

/**
 * Bottom padding for a scrollable tab screen: the tab bar plus the
 * home-indicator inset, so the last card is never hidden behind the bar.
 */
export function tabScreenBottomPadding(bottomInset: number): number {
  return bottomInset + TAB_BAR_HEIGHT;
}
