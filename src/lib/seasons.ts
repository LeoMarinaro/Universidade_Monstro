import type { SeasonFormat } from "@/generated/prisma/client";
import { dateToKey, formatDayMonth, keyToDate, type DayKey } from "@/lib/dates";

export const FORMAT_LABELS: Record<SeasonFormat, string> = {
  RAW_POINTS: "Pontos brutos",
  KNOCKOUT: "Mata-mata",
  STAGES: "Etapas",
};

// Week number inside the season (S1 = 1) for a given day.
// Before the start it's 0; after the end it's greater than `weeks`.
export function seasonWeek(startDate: Date, day: DayKey) {
  const days = (keyToDate(day).getTime() - keyToDate(dateToKey(startDate)).getTime()) / 86_400_000;
  return Math.floor(days / 7) + 1;
}

// Someone's off week in a season, in words
export function offWeekStatus(offWeek: number | null, currentWeek: number) {
  if (offWeek === null) return "Disponível";
  if (offWeek > currentWeek) return `Agendada na S${offWeek}`;
  if (offWeek === currentWeek) return "De off nesta semana";
  return `Usada na S${offWeek}`;
}

// "2,9": one decimal, Brazilian comma
export function formatAverage(total: number, weeks: number) {
  return (weeks > 0 ? total / weeks : 0).toFixed(1).replace(".", ",");
}

type SeasonInfo = { number: number; format: SeasonFormat; startDate: Date; weeks: number };

// "T11 · Semana 18 · Pontos brutos", or the season's state when it isn't running
export function seasonSummary(season: SeasonInfo | null, today: DayKey) {
  if (!season) return "Sem temporada ativa";

  const week = seasonWeek(season.startDate, today);
  if (week < 1) return `T${season.number} · começa em ${formatDayMonth(dateToKey(season.startDate))}`;
  if (week > season.weeks) return `T${season.number} · aguardando encerramento`;
  return `T${season.number} · Semana ${week} · ${FORMAT_LABELS[season.format]}`;
}
