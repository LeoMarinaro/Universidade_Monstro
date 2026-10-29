"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { todayKey } from "@/lib/dates";
import { isGroupAdmin } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";

// Takes someone out of the group's running season, if they're in it. They keep
// counting in the weeks before (past weeks never change) and stop from the
// current week. Before the season starts they simply leave the participant list.
async function leaveRunningSeason(tx: Prisma.TransactionClient, groupId: string, userId: string) {
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

export async function removeFromSeason(groupId: string, userId: string) {
  const admin = await getCurrentUser();
  if (!(await isGroupAdmin(groupId, admin))) return;

  await prisma.$transaction((tx) => leaveRunningSeason(tx, groupId, userId));
  refresh();
}

// Removes a member from the group (and from the running season). An admin
// can't remove themselves (that's "leave the group"), and the group always
// keeps at least one admin.
export async function removeFromGroup(groupId: string, userId: string) {
  const admin = await getCurrentUser();
  if (userId === admin.id || !(await isGroupAdmin(groupId, admin))) return;

  const target = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { role: true },
  });
  if (!target) return;
  if (target.role === "ADMIN") {
    const otherAdmins = await prisma.membership.count({
      where: { groupId, role: "ADMIN", userId: { not: userId } },
    });
    if (otherAdmins === 0) return;
  }

  await prisma.$transaction(async (tx) => {
    await leaveRunningSeason(tx, groupId, userId);
    await tx.membership.delete({ where: { userId_groupId: { userId, groupId } } });
  });
  refresh();
}

// The user leaves the group (and its running season). The only admin can't
// leave while others remain: they make someone admin first. The last member
// leaving deletes the group.
export async function leaveGroup(groupId: string) {
  const user = await getCurrentUser();
  const me = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    select: { role: true },
  });
  if (!me) return;

  const others = await prisma.membership.findMany({
    where: { groupId, userId: { not: user.id } },
    select: { role: true },
  });
  if (others.length === 0) {
    // Seasons, participants and results go with the group (cascade); workouts stay
    await prisma.group.delete({ where: { id: groupId } });
    redirect("/");
  }
  if (me.role === "ADMIN" && !others.some((other) => other.role === "ADMIN")) return;

  await prisma.$transaction(async (tx) => {
    await leaveRunningSeason(tx, groupId, user.id);
    await tx.membership.delete({ where: { userId_groupId: { userId: user.id, groupId } } });
  });
  redirect("/");
}

export async function makeAdmin(groupId: string, userId: string) {
  const admin = await getCurrentUser();
  if (!(await isGroupAdmin(groupId, admin))) return;

  await prisma.membership.updateMany({ where: { groupId, userId }, data: { role: "ADMIN" } });
  refresh();
}

// New invite link; the old one stops working (e.g. so a removed member can't rejoin)
export async function regenerateInviteCode(groupId: string) {
  const admin = await getCurrentUser();
  if (!(await isGroupAdmin(groupId, admin))) return;

  await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: randomBytes(16).toString("base64url") },
  });
  refresh();
}
