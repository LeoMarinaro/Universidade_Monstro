import type { Prisma } from "@/generated/prisma/client";
import { todayKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";

// Takes someone out of a group's running season, if they're in it. They keep
// counting in the weeks before (past weeks never change) and stop from the
// current week. Before the season starts they simply leave the participant list.
export async function leaveRunningSeason(tx: Prisma.TransactionClient, groupId: string, userId: string) {
  const season = await tx.season.findFirst({
    where: { groupId, finalizedAt: null },
    select: { id: true, startDate: true, weeks: true },
  });
  if (!season) return;

  const currentWeek = seasonWeek(season.startDate, todayKey());
  if (currentWeek < 1) {
    await tx.seasonParticipant.deleteMany({ where: { seasonId: season.id, userId } });
    return;
  }
  if (currentWeek > season.weeks) return; // season over: nothing left to stop

  await tx.seasonParticipant.updateMany({
    where: { seasonId: season.id, userId, removedFromWeek: null },
    data: { removedFromWeek: currentWeek },
  });
}

// Deleted accounts ("Conta deletada") are removed for good once no running
// season needs them; finished seasons keep their saved SeasonResult, which
// then shows "Conta deletada" (userId becomes null).
export async function purgeDeletedUsers() {
  await prisma.user.deleteMany({
    where: {
      deletedAt: { not: null },
      seasonEntries: { none: { season: { finalizedAt: null } } },
    },
  });
}
