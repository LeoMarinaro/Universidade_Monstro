"use server";

import { refresh } from "next/cache";
import { dateToKey } from "@/lib/dates";
import { competingGroupsOnDay } from "@/lib/group-workouts";
import { isGroupAdmin } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// Admin accepts or refuses a diary change. Accepting makes the group's record
// follow the diary for that day. A request that no longer fits (the season was
// finalized, the person left it) can only be refused.
export async function decideRequest(requestId: string, accept: boolean) {
  const admin = await getCurrentUser();
  const request = await prisma.workoutRequest.findUnique({
    where: { id: requestId },
    select: { groupId: true, userId: true, date: true, action: true, status: true },
  });
  if (!request || request.status !== "PENDING" || !(await isGroupAdmin(request.groupId, admin))) return;

  const { groupId, userId, date } = request;
  const stillCounts = (await competingGroupsOnDay(userId, dateToKey(date))).includes(groupId);
  const apply = accept && stillCounts;

  await prisma.$transaction(async (tx) => {
    // status: PENDING in the filter = only the first decision counts
    const { count } = await tx.workoutRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: { status: apply ? "APPROVED" : "REJECTED", decidedById: admin.id, decidedAt: new Date() },
    });
    if (count === 0 || !apply) return;

    if (request.action === "ADD") {
      await tx.groupWorkout.upsert({
        where: { groupId_userId_date: { groupId, userId, date } },
        create: { groupId, userId, date, source: "SELF", markedById: userId },
        update: {},
      });
    } else {
      await tx.groupWorkout.deleteMany({ where: { groupId, userId, date } });
    }
  });

  refresh();
}
