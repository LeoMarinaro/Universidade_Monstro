// Workouts are calendar days in Brazil time. In code a day is a "YYYY-MM-DD"
// key; in the database it's a DATE column, which Prisma reads as UTC midnight.
const TIME_ZONE = "America/Sao_Paulo";

export type DayKey = string; // e.g. "2026-10-29"

export function todayKey(now = new Date()): DayKey {
  // The en-CA locale formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function keyToDate(key: DayKey) {
  return new Date(`${key}T00:00:00Z`);
}

export function dateToKey(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = keyToDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToKey(date);
}

// Weeks run Monday to Sunday, like the group's seasons
export function weekStart(key: DayKey): DayKey {
  // getUTCDay: 0 = Sunday … 6 = Saturday; days since the last Monday
  const daysSinceMonday = (keyToDate(key).getUTCDay() + 6) % 7;
  return addDays(key, -daysSinceMonday);
}

// "2026-10-26" -> "26/10"
export function formatDayMonth(key: DayKey) {
  const [, month, day] = key.split("-");
  return `${Number(day)}/${Number(month)}`;
}
