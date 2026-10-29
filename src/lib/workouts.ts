import { addDays, dateToKey, keyToDate, todayKey, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

// How many weeks the workout grid shows, current week included
export const GRID_WEEKS = 8;

// The user's workout days from the first day of the grid up to today
export async function getRecentWorkoutDays(userId: string) {
  const today = todayKey();
  const from = addDays(weekStart(today), -7 * (GRID_WEEKS - 1));

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: keyToDate(from), lte: keyToDate(today) } },
    select: { date: true },
  });

  return { today, days: new Set(workouts.map((workout) => dateToKey(workout.date))) };
}
