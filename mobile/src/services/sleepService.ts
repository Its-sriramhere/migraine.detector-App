import type { SleepNight } from "./ble/watchProtocol";
import { watchService } from "./watchService";

/**
 * Sleep data provider.
 *
 * The wearable firmware does not report sleep stages yet — it only sends a
 * total sleep duration with the vitals packet. Until it does, the stage
 * split comes from a deterministic mock derived from that duration, so the
 * sleep screen has realistic data to draw.
 *
 * When the firmware starts filling the sleep characteristic, `readFromWatch`
 * takes over and every screen keeps working unchanged.
 */
export function mockSleepNight(
  totalMinutes: number,
  date: Date = new Date(),
): SleepNight {
  // Seeded by the calendar day so a night always looks the same while the
  // app is open, but still differs from the night before.
  const seed = Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86_400_000,
  );
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };

  const awake = Math.round(totalMinutes * (0.03 + rand(1) * 0.04));
  const deep = Math.round(totalMinutes * (0.16 + rand(2) * 0.08));
  const rem = Math.round(totalMinutes * (0.18 + rand(3) * 0.07));
  const light = Math.max(0, totalMinutes - awake - deep - rem);

  const shortNightPenalty = totalMinutes < 420 ? 18 : 0;
  const quality = Math.round(
    Math.max(
      0,
      Math.min(100, 100 - awake * 0.6 - shortNightPenalty - rand(4) * 6),
    ),
  );

  return {
    date: date.toISOString(),
    totalMinutes,
    awakeMinutes: awake,
    remMinutes: rem,
    lightMinutes: light,
    deepMinutes: deep,
    quality,
  };
}

/** Read the last night from the wearable, if it is connected and reports it. */
export async function readSleepFromWatch(): Promise<SleepNight | null> {
  if (!watchService.available || !watchService.connected) return null;
  try {
    return await watchService.readSleep();
  } catch {
    return null;
  }
}

/**
 * The last night of sleep: real wearable data when available, otherwise the
 * mock built from the reported sleep duration.
 */
export async function getLastNight(
  totalMinutes?: number,
): Promise<SleepNight> {
  const fromWatch = await readSleepFromWatch();
  if (fromWatch) return fromWatch;
  return mockSleepNight(totalMinutes ?? 440);
}

/** The four stages in the order the sleep chart stacks them. */
export const SLEEP_STAGES = ["awake", "rem", "light", "deep"] as const;
