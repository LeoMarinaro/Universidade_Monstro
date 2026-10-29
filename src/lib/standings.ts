import type { SeasonFormat } from "@/generated/prisma/client";
import { addDays, dateToKey, keyToDate, type DayKey } from "@/lib/dates";
import { FORMAT_MODULES } from "@/lib/formats";
import { applyOffWeeks } from "@/lib/off-week";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";

type SeasonForStandings = {
  id: string;
  groupId: string;
  format: SeasonFormat;
  config: unknown;
  startDate: Date;
  weeks: number;
};

// Live standings of a running season, recalculated on every request from the
// group's own workout record (GroupWorkout, not the personal diaries).
// Finished seasons will read their saved SeasonResult instead.
export async function getSeasonStandings(season: SeasonForStandings, today: DayKey) {
  const start = dateToKey(season.startDate);
  const end = addDays(start, season.weeks * 7 - 1);
  const currentWeek = seasonWeek(season.startDate, today);
  // Weeks that have started so far (0 before the season, capped at its length)
  const lastWeek = Math.min(Math.max(currentWeek, 0), season.weeks);

  const participants = await prisma.seasonParticipant.findMany({
    where: { seasonId: season.id },
    select: {
      userId: true,
      offWeek: true,
      removedFromWeek: true,
      user: { select: { name: true, image: true, deletedAt: true } },
    },
  });

  const workouts = await prisma.groupWorkout.findMany({
    where: {
      groupId: season.groupId,
      userId: { in: participants.map((p) => p.userId) },
      date: { gte: keyToDate(start), lte: keyToDate(end) },
    },
    select: { userId: true, date: true },
  });

  // Real workouts per person per week, and the exact days (for the week tab)
  const raw = new Map(participants.map((p) => [p.userId, Array<number>(season.weeks).fill(0)]));
  const days = new Map(participants.map((p) => [p.userId, new Set<DayKey>()]));
  for (const workout of workouts) {
    const day = dateToKey(workout.date);
    raw.get(workout.userId)![seasonWeek(season.startDate, day) - 1]++;
    days.get(workout.userId)!.add(day);
  }

  const counted = applyOffWeeks(
    participants.map((p) => ({
      userId: p.userId,
      raw: raw.get(p.userId)!,
      offWeek: p.offWeek,
      removedFromWeek: p.removedFromWeek,
    })),
    lastWeek,
  );

  const formatModule = FORMAT_MODULES[season.format];
  if (!formatModule) throw new Error(`Season format ${season.format} isn't implemented yet`);
  const points = new Map(
    formatModule
      .calculate(
        participants.map((p) => ({ userId: p.userId, weekly: counted.get(p.userId)! })),
        season.config,
      )
      .map((result) => [result.userId, result.points]),
  );

  const rows = participants.map((p) => ({
    userId: p.userId,
    name: p.user.deletedAt ? "Conta deletada" : p.user.name,
    image: p.user.deletedAt ? null : p.user.image,
    points: points.get(p.userId) ?? 0,
    weekly: counted.get(p.userId)!,
    offWeek: p.offWeek,
    removedFromWeek: p.removedFromWeek,
    days: days.get(p.userId)!,
  }));

  // Most points first; people removed from the season go to the bottom with
  // frozen points. Equal points share the position (1º, 1º, 3º…).
  rows.sort(
    (a, b) =>
      Number(a.removedFromWeek !== null) - Number(b.removedFromWeek !== null) ||
      b.points - a.points ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
  const ranked = rows.map((row) => {
    const firstWithSamePoints = rows.findIndex(
      (other) => other.points === row.points && (other.removedFromWeek === null) === (row.removedFromWeek === null),
    );
    return { ...row, position: firstWithSamePoints + 1 };
  });

  return { currentWeek, lastWeek, rows: ranked };
}
