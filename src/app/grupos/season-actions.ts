"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { addDays, dateToKey, keyToDate, todayKey, type DayKey } from "@/lib/dates";
import { isGroupAdmin } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { getSeasonStandings } from "@/lib/standings";

export type CreateSeasonState = { error: string | null };

const MAX_WEEKS = 104;

// Admin creates a season. The start date may be in the past (a season that
// already began outside the site).
export async function createSeason(
  groupId: string,
  _previous: CreateSeasonState,
  formData: FormData,
): Promise<CreateSeasonState> {
  const user = await getCurrentUser();
  if (!(await isGroupAdmin(groupId, user))) {
    return { error: "Só o admin do grupo pode criar temporadas." };
  }

  // One season at a time per group
  const running = await prisma.season.findFirst({
    where: { groupId, finalizedAt: null },
    select: { id: true },
  });
  if (running) return { error: "Já existe uma temporada em andamento. Encerre ela primeiro." };

  const number = Number(formData.get("number"));
  const name = String(formData.get("name") ?? "").trim() || null;
  const start = String(formData.get("startDate") ?? "");
  const weeks = Number(formData.get("weeks"));
  const offWeekEnabled = formData.get("offWeekEnabled") === "on";
  const participantIds = formData.getAll("participants").map(String);
  const offS1Ids = offWeekEnabled ? formData.getAll("offS1").map(String) : [];

  if (!Number.isInteger(number) || number < 1) return { error: "Número da temporada inválido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || keyToDate(start).getUTCDay() !== 1) {
    return { error: "A data de início precisa ser uma segunda-feira." };
  }
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) {
    return { error: `A duração precisa ser entre 1 e ${MAX_WEEKS} semanas.` };
  }

  // Participants must be members of this group
  const members = await prisma.membership.findMany({
    where: { groupId, userId: { in: participantIds } },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));
  const participants = participantIds.filter((id) => memberIds.has(id));
  if (participants.length === 0) return { error: "Escolha pelo menos um participante." };

  const numberTaken = await prisma.season.findUnique({
    where: { groupId_number: { groupId, number } },
    select: { id: true },
  });
  if (numberTaken) return { error: `Já existe a T${number} neste grupo.` };

  const now = new Date();
  await prisma.season.create({
    data: {
      groupId,
      number,
      name,
      format: "RAW_POINTS",
      startDate: keyToDate(start),
      weeks,
      offWeekEnabled,
      participants: {
        create: participants.map((userId) =>
          offS1Ids.includes(userId)
            ? {
                userId,
                offWeek: 1,
                offWeekSource: "ADMIN" as const,
                offWeekActivatedAt: now,
                offWeekActivatedById: user.id,
              }
            : { userId },
        ),
      },
    },
  });

  redirect(`/grupos/${groupId}`);
}

// The competitor turns on their own off week. No approval: it applies to the
// NEXT week, once per season.
export async function activateOffWeek(seasonId: string) {
  const user = await getCurrentUser();
  const participant = await prisma.seasonParticipant.findUnique({
    where: { seasonId_userId: { seasonId, userId: user.id } },
    select: {
      removedFromWeek: true,
      season: { select: { startDate: true, weeks: true, offWeekEnabled: true, finalizedAt: true } },
    },
  });
  if (!participant) return;

  const { season } = participant;
  const targetWeek = seasonWeek(season.startDate, todayKey()) + 1;
  const allowed =
    season.offWeekEnabled &&
    !season.finalizedAt &&
    participant.removedFromWeek === null &&
    targetWeek >= 1 &&
    targetWeek <= season.weeks;
  if (!allowed) return;

  // offWeek: null in the filter = only if it wasn't used yet (safe against double taps)
  await prisma.seasonParticipant.updateMany({
    where: { seasonId, userId: user.id, offWeek: null },
    data: {
      offWeek: targetWeek,
      offWeekSource: "SELF",
      offWeekActivatedAt: new Date(),
      offWeekActivatedById: user.id,
    },
  });

  refresh();
}

// Admin sets anyone's off week, past weeks included (re-entering old data),
// or clears it (empty value)
export async function setOffWeekByAdmin(seasonId: string, userId: string, formData: FormData) {
  const admin = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { groupId: true, weeks: true, finalizedAt: true },
  });
  if (!season || season.finalizedAt || !(await isGroupAdmin(season.groupId, admin))) return;

  const value = String(formData.get("offWeek") ?? "");
  const week = value === "" ? null : Number(value);
  if (week !== null && (!Number.isInteger(week) || week < 1 || week > season.weeks)) return;

  await prisma.seasonParticipant.updateMany({
    where: { seasonId, userId },
    data:
      week === null
        ? { offWeek: null, offWeekSource: null, offWeekActivatedAt: null, offWeekActivatedById: null }
        : {
            offWeek: week,
            offWeekSource: "ADMIN",
            offWeekActivatedAt: new Date(),
            offWeekActivatedById: admin.id,
          },
  });

  refresh();
}

// Week editor: the admin adds or removes a participant's workout on a day of
// the running season (late workouts, re-entering old data, fixing mistakes).
// It changes only this group's record, never the person's diary. Removing
// works on any workout, including ones the person marked.
export async function toggleWorkoutByAdmin(seasonId: string, userId: string, day: DayKey) {
  const admin = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { groupId: true, startDate: true, weeks: true, finalizedAt: true },
  });
  if (!season || season.finalizedAt || !(await isGroupAdmin(season.groupId, admin))) return;

  // Only days inside the season, up to today, for people competing in it
  const start = dateToKey(season.startDate);
  const end = addDays(start, season.weeks * 7 - 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < start || day > end || day > todayKey()) return;
  const participant = await prisma.seasonParticipant.findUnique({
    where: { seasonId_userId: { seasonId, userId } },
    select: { userId: true },
  });
  if (!participant) return;

  const date = keyToDate(day);
  const { groupId } = season;

  // The admin's tap settles any request still waiting for this day
  await prisma.workoutRequest.updateMany({
    where: { groupId, userId, date, status: "PENDING" },
    data: { status: "REJECTED", decidedById: admin.id, decidedAt: new Date() },
  });

  const { count } = await prisma.groupWorkout.deleteMany({ where: { groupId, userId, date } });
  if (count === 0) {
    try {
      await prisma.groupWorkout.create({
        data: { groupId, userId, date, source: "ADMIN", markedById: admin.id },
      });
    } catch (error) {
      // Someone marked it at the same moment: one workout per day either way
      const alreadyMarked =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!alreadyMarked) throw error;
    }
  }

  refresh();
}

export type UpdateSeasonState = { error: string | null };

// Admin edits the running season: name, start date (a Monday, may be in the
// past) and duration. The duration can't end before the current week or before
// someone's off week. Off weeks are stored by week number, so they keep their
// number (S3 stays S3) when the start date moves.
export async function updateSeason(
  seasonId: string,
  _previous: UpdateSeasonState,
  formData: FormData,
): Promise<UpdateSeasonState> {
  const user = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: {
      groupId: true,
      finalizedAt: true,
      participants: { select: { offWeek: true } },
    },
  });
  if (!season || season.finalizedAt || !(await isGroupAdmin(season.groupId, user))) {
    return { error: "Só o admin do grupo pode editar a temporada." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const start = String(formData.get("startDate") ?? "");
  const weeks = Number(formData.get("weeks"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || keyToDate(start).getUTCDay() !== 1) {
    return { error: "A data de início precisa ser uma segunda-feira." };
  }
  const startDate = keyToDate(start);
  const minWeeks = Math.max(
    1,
    seasonWeek(startDate, todayKey()),
    ...season.participants.map((p) => p.offWeek ?? 0),
  );

  if (!Number.isInteger(weeks) || weeks > MAX_WEEKS) {
    return { error: `A duração precisa ser no máximo ${MAX_WEEKS} semanas.` };
  }
  if (weeks < minWeeks) {
    return {
      error: `A duração precisa ser pelo menos ${minWeeks} semanas (a semana atual ou a semana off mais tarde de alguém).`,
    };
  }

  await prisma.season.update({ where: { id: seasonId }, data: { name, startDate, weeks } });
  redirect(`/grupos/${season.groupId}`);
}

// Admin deletes the running season (e.g. created by mistake). Its participants
// and off weeks go with it; workouts belong to the people, so they stay.
export async function deleteSeason(seasonId: string) {
  const user = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { groupId: true, finalizedAt: true },
  });
  if (!season || season.finalizedAt || !(await isGroupAdmin(season.groupId, user))) return;

  await prisma.season.delete({ where: { id: seasonId } });
  redirect(`/grupos/${season.groupId}`);
}

// Admin ends the season: the final standings are saved in SeasonResult and
// never recalculated again; the group is free for the next season
export async function finalizeSeason(seasonId: string) {
  const user = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      groupId: true,
      format: true,
      config: true,
      startDate: true,
      weeks: true,
      finalizedAt: true,
    },
  });
  if (!season || season.finalizedAt || !(await isGroupAdmin(season.groupId, user))) return;

  // Ending early is allowed once the season has started: it then ends in the
  // current week (its duration is shortened to it)
  const today = todayKey();
  const currentWeek = seasonWeek(season.startDate, today);
  if (currentWeek < 1) return;
  const weeks = Math.min(currentWeek, season.weeks);

  const standings = await getSeasonStandings({ ...season, weeks }, today);

  await prisma.$transaction(async (tx) => {
    // finalizedAt: null in the filter = only the first click saves results
    const { count } = await tx.season.updateMany({
      where: { id: seasonId, finalizedAt: null },
      data: { finalizedAt: new Date(), weeks },
    });
    if (count === 0) return;

    await tx.seasonResult.createMany({
      data: standings.rows.map((row) => ({
        seasonId,
        userId: row.userId,
        position: row.position,
        points: row.points,
        workouts: row.weekly.reduce((sum, count) => sum + count, 0),
        weeklyWorkouts: row.weekly,
        offWeek: row.offWeek,
        removedFromWeek: row.removedFromWeek,
      })),
    });
  });

  refresh();
}

// Cancelling is allowed while the off week hasn't started yet
export async function cancelOffWeek(seasonId: string) {
  const user = await getCurrentUser();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { startDate: true, finalizedAt: true },
  });
  if (!season || season.finalizedAt) return;

  const currentWeek = seasonWeek(season.startDate, todayKey());
  await prisma.seasonParticipant.updateMany({
    where: { seasonId, userId: user.id, offWeek: { gt: currentWeek } },
    data: {
      offWeek: null,
      offWeekSource: null,
      offWeekActivatedAt: null,
      offWeekActivatedById: null,
    },
  });

  refresh();
}
