import type { Prisma } from "@/generated/prisma/client";
import { addDays, dateToKey, type DayKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";

type Db = Prisma.TransactionClient | typeof prisma;

// Groups where a day counts for this person: a running (not finalized) season
// that covers the day, and the person still competing in that week
export async function competingGroupsOnDay(userId: string, day: DayKey, db: Db = prisma) {
  const entries = await db.seasonParticipant.findMany({
    where: { userId, season: { finalizedAt: null } },
    select: {
      removedFromWeek: true,
      season: { select: { groupId: true, startDate: true, weeks: true } },
    },
  });

  return entries
    .filter(({ season, removedFromWeek }) => {
      const start = dateToKey(season.startDate);
      const end = addDays(start, season.weeks * 7 - 1);
      if (day < start || day > end) return false;
      return removedFromWeek === null || seasonWeek(season.startDate, day) < removedFromWeek;
    })
    .map(({ season }) => season.groupId);
}
