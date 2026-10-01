// The one place that decides whether the store is open. Pure and free of
// server-only imports, so the customer site (banner, disabled buttons) and
// the server (createOrder, Telegram) all use exactly the same rule.

export const STORE_TIME_ZONE = "Asia/Dhaka";
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type StoreSchedule = {
  isOpen: boolean;
  autoSchedule: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type StoreStatus = {
  open: boolean;
  // Why it is closed: the manual switch, or outside the scheduled hours.
  reason: "open" | "manual" | "schedule";
  // Whether a usable schedule is in effect.
  scheduled: boolean;
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Minutes since midnight in Dhaka for the given moment. */
export function dhakaMinutes(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

function hasSchedule(schedule: StoreSchedule) {
  return (
    schedule.autoSchedule &&
    TIME_PATTERN.test(schedule.openTime ?? "") &&
    TIME_PATTERN.test(schedule.closeTime ?? "")
  );
}

/**
 * Open when the manual switch is on and, if auto schedule is on, the Dhaka
 * time is between openTime and closeTime. A closeTime at or before openTime
 * means the window runs past midnight (18:00 to 04:00).
 */
export function getStoreStatus(schedule: StoreSchedule, now: Date = new Date()): StoreStatus {
  const scheduled = hasSchedule(schedule);

  if (!schedule.isOpen) {
    return { open: false, reason: "manual", scheduled };
  }

  if (scheduled) {
    const current = dhakaMinutes(now);
    const opens = toMinutes(schedule.openTime!);
    const closes = toMinutes(schedule.closeTime!);
    const within =
      opens < closes
        ? current >= opens && current < closes
        : current >= opens || current < closes; // overnight (or 24h when equal)

    if (!within) {
      return { open: false, reason: "schedule", scheduled };
    }
  }

  return { open: true, reason: "open", scheduled };
}

export function isStoreOpen(schedule: StoreSchedule, now: Date = new Date()) {
  return getStoreStatus(schedule, now).open;
}

/** "18:00" -> "6:00 PM". Returns null for a missing or invalid time. */
export function formatTime(time: string | null | undefined) {
  if (!time || !TIME_PATTERN.test(time)) return null;

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}
