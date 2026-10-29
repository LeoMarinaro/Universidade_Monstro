import { addDays, dateToKey, keyToDate, todayKey, weekStart } from "@/lib/dates";
import { GRID_WEEKS } from "@/lib/grid";
import { prisma } from "@/lib/prisma";

// A user's diary days from the first day of the grid up to today
export async function getRecentWorkoutDays(userId: string) {
  const today = todayKey();
  const from = addDays(weekStart(today), -7 * (GRID_WEEKS - 1));

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: keyToDate(from), lte: keyToDate(today) } },
    select: { date: true },
  });

  return { today, days: workouts.map((workout) => dateToKey(workout.date)) };
}

// The user's diary changes sent to group admins: waiting ones, and the ones
// answered in the last 7 days (so the person sees the answer)
export async function getMyRecentRequests(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  return prisma.workoutRequest.findMany({
    where: { userId, OR: [{ status: "PENDING" }, { decidedAt: { gte: weekAgo } }] },
    orderBy: [{ date: "desc" }],
    take: 10,
    select: {
      id: true,
      date: true,
      action: true,
      status: true,
      group: { select: { name: true } },
    },
  });
}
