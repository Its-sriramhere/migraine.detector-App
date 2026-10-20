import type { Vitals, WatchInfo } from "./watchProtocol";

/**
 * A simulated wearable emitting realistic vitals, shaped exactly like the
 * real watch, so the app can be exercised before the firmware exists.
 */
export function createSimulatedWatch(): {
  connect: () => Promise<void>;
  disconnect: () => void;
  writeAlert: (level: number) => void;
  subscribe: (cb: (v: Vitals) => void) => () => void;
  info: () => WatchInfo;
} {
  let timer: ReturnType<typeof setInterval> | null = null;
  let t = 0;
  const base: Vitals = {
    version: 1,
    heart_rate: 72,
    hrv: 45,
    spo2: 98,
    temperature: 36.6,
    systolic_bp: 118,
    diastolic_bp: 76,
    sleep_minutes: 440,
    activity: 0.15,
    signal_quality: 0.95,
  };

  const next = (): Vitals => {
    t += 1;
    const wobble = Math.sin(t / 3) * 3;
    return {
      ...base,
      heart_rate: Math.round(base.heart_rate + wobble + (Math.random() - 0.5) * 4),
      hrv: Math.round(base.hrv + wobble * 1.5 + (Math.random() - 0.5) * 5),
      spo2: Math.round(base.spo2 + (Math.random() - 0.5) * 2),
      temperature: Number(
        (base.temperature + (Math.random() - 0.5) * 0.2).toFixed(2),
      ),
      activity: Number(
        Math.max(0, base.activity + (Math.random() - 0.5) * 0.1).toFixed(3),
      ),
    };
  };

  return {
    connect: async () => {},
    disconnect: () => {
      if (timer) clearInterval(timer);
      timer = null;
    },
    writeAlert: () => {},
    subscribe: (cb) => {
      timer = setInterval(() => cb(next()), 2000);
      return () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
    },
    info: () => ({ firmware: "sim-1.0.0", battery: 78, capabilities: 0x0f }),
  };
}
