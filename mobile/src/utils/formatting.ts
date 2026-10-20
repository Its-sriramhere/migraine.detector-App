export function formatRiskScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function riskLevelLabel(level: string): string {
  return level.toUpperCase();
}

/**
 * The backend stores naive UTC timestamps (`utcnow()` strips tzinfo) and
 * serializes them without a zone designator, e.g. "2026-10-20T07:54:03.970".
 * JS would parse that as local time, so treat zone-less strings as UTC.
 */
export function parseBackendDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso.trim());
  const d = new Date(hasZone ? iso : `${iso.trim()}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTimestamp(iso?: string | null): string {
  const d = parseBackendDate(iso);
  if (!d) return "—";
  return d.toLocaleString();
}

export function timeAgo(iso?: string | null): string {
  const d = parseBackendDate(iso);
  if (!d) return "—";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return d.toLocaleString();
}

/** Plain-language risk summary used on the home card. Never a diagnosis. */
export function riskSentence(level: string, score: number): string {
  const pct = Math.round(score);
  switch (level) {
    case "high":
      return `Elevated risk signals detected (${pct}%). Review your recent signals and your care plan.`;
    case "moderate":
      return `Some risk signals are above your normal range (${pct}%). Keep your routine steady and rest well.`;
    default:
      return "No significant risk signal detected in the next 24 hours.";
  }
}

/** Formats minutes of sleep as "7h 20m". */
export function formatSleep(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
