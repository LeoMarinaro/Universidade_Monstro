"use server";

import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { keyToDate, todayKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// "Treinei hoje": today's workout, in Brazil time
export async function markWorkoutToday() {
  const user = await getCurrentUser();

  try {
    await prisma.workout.create({
      data: {
        userId: user.id,
        date: keyToDate(todayKey()),
        source: "SELF",
        markedById: user.id,
      },
    });
  } catch (error) {
    // Already marked (double tap, two tabs): one workout per day is the rule anyway
    const alreadyMarked =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!alreadyMarked) throw error;
  }

  refresh();
}

// Undo a mistaken tap. Only today's workout the user marked themselves:
// one added by an admin stays.
export async function unmarkWorkoutToday() {
  const user = await getCurrentUser();

  await prisma.workout.deleteMany({
    where: { userId: user.id, date: keyToDate(todayKey()), source: "SELF" },
  });

  refresh();
}
