"use server";

import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { keyToDate, todayKey, type DayKey } from "@/lib/dates";
import { competingGroupsOnDay } from "@/lib/group-workouts";
import { isGroupAdmin } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// "Treinei hoje": today's workout (Brazil time) in the diary AND, directly,
// in every group where the person is competing today
export async function markWorkoutToday() {
  const user = await getCurrentUser();
  const today = todayKey();
  const date = keyToDate(today);

  try {
    await prisma.workout.create({ data: { userId: user.id, date } });
  } catch (error) {
    // Already marked (double tap, two tabs): one workout per day is the rule anyway
    if (!isUniqueViolation(error)) throw error;
  }

  for (const groupId of await competingGroupsOnDay(user.id, today)) {
    await prisma.groupWorkout.upsert({
      where: { groupId_userId_date: { groupId, userId: user.id, date } },
      create: { groupId, userId: user.id, date, source: "SELF", markedById: user.id },
      update: {},
    });
  }

  refresh();
}

// Undo a mistaken tap on today's workout: from the diary and from the groups
// it went to. A workout the admin put in a group stays there.
export async function unmarkWorkoutToday() {
  const user = await getCurrentUser();
  const date = keyToDate(todayKey());

  await prisma.workout.deleteMany({ where: { userId: user.id, date } });
  await prisma.groupWorkout.deleteMany({ where: { userId: user.id, date, source: "SELF" } });

  refresh();
}

// Tap on a past day in the diary grid: adds or removes it in the diary. For
// each group whose running season covers that day, the group's record doesn't
// change by itself: a request goes to the admin (or applies at once when the
// person is that group's admin). Changing back before the admin answers
// cancels the request.
export async function togglePastWorkout(day: DayKey) {
  const user = await getCurrentUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day >= todayKey()) return;
  const date = keyToDate(day);

  const { count } = await prisma.workout.deleteMany({ where: { userId: user.id, date } });
  const nowInDiary = count === 0;
  if (nowInDiary) {
    try {
      await prisma.workout.create({ data: { userId: user.id, date } });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  for (const groupId of await competingGroupsOnDay(user.id, day)) {
    const where = { groupId_userId_date: { groupId, userId: user.id, date } };
    const inGroup = (await prisma.groupWorkout.findUnique({ where, select: { id: true } })) !== null;

    // A newer change replaces any request still waiting for this day
    await prisma.workoutRequest.deleteMany({
      where: { groupId, userId: user.id, date, status: "PENDING" },
    });
    if (inGroup === nowInDiary) continue; // the group already matches the diary

    if (await isGroupAdmin(groupId, user)) {
      if (nowInDiary) {
        await prisma.groupWorkout.create({
          data: { groupId, userId: user.id, date, source: "SELF", markedById: user.id },
        });
      } else {
        await prisma.groupWorkout.delete({ where });
      }
    } else {
      await prisma.workoutRequest.create({
        data: { groupId, userId: user.id, date, action: nowInDiary ? "ADD" : "REMOVE" },
      });
    }
  }

  refresh();
}
