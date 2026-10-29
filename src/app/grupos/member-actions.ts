"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isGroupAdmin } from "@/lib/groups";
import { leaveRunningSeason } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

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
