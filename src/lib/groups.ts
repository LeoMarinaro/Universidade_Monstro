import { readFinalBracket } from "@/lib/formats/playoffs";
import { prisma } from "@/lib/prisma";

// Groups the user belongs to, each with its member count and current season
// (the one not finalized yet; a group runs one season at a time)
export async function getUserGroups(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
          seasons: {
            where: { finalizedAt: null },
            orderBy: { number: "desc" },
            take: 1,
            select: { number: true, format: true, startDate: true, weeks: true },
          },
        },
      },
    },
  });

  return memberships.map(({ role, group }) => ({
    id: group.id,
    name: group.name,
    role,
    memberCount: group._count.members,
    currentSeason: group.seasons[0] ?? null,
  }));
}

// One group as seen by a member (or the super admin). Returns null when the
// user can't see it, so the page answers 404 without revealing the group exists.
export async function getGroupForUser(groupId: string, user: { id: string; isSuperAdmin: boolean }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      members: {
        // ADMIN sorts before COMPETITOR (enum order)
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        select: { role: true, user: { select: { id: true, name: true, image: true } } },
      },
      seasons: {
        where: { finalizedAt: null },
        orderBy: { number: "desc" },
        take: 1,
        select: {
          id: true,
          number: true,
          name: true,
          format: true,
          config: true,
          startDate: true,
          weeks: true,
          offWeekEnabled: true,
        },
      },
    },
  });
  if (!group) return null;

  const myRole = group.members.find((member) => member.user.id === user.id)?.role ?? null;
  if (!myRole && !user.isSuperAdmin) return null;

  return {
    id: group.id,
    name: group.name,
    members: group.members,
    currentSeason: group.seasons[0] ?? null,
    myRole,
    isAdmin: myRole === "ADMIN" || user.isSuperAdmin,
    // Only admins share the invite link
    inviteCode: myRole === "ADMIN" || user.isSuperAdmin ? group.inviteCode : null,
  };
}

// Finished seasons of a group, newest first, with their champions (equal
// points share the 1st place, so there can be more than one). Play-offs also
// have the bracket's champions, next to the general classification's; in duplas
// the champions are the winning pairs.
export async function getFinishedSeasons(groupId: string) {
  const seasons = await prisma.season.findMany({
    where: { groupId, finalizedAt: { not: null } },
    orderBy: { number: "desc" },
    select: {
      number: true,
      name: true,
      format: true,
      config: true,
      results: {
        select: {
          userId: true,
          position: true,
          removedFromWeek: true,
          teamNumber: true,
          teamPosition: true,
          user: { select: { name: true, deletedAt: true } },
        },
      },
    },
  });

  return seasons.map(({ results, config, ...season }) => {
    const nameOf = (result: (typeof results)[number] | undefined) =>
      !result?.user || result.user.deletedAt ? "Conta deletada" : result.user.name;
    const bracket = readFinalBracket(config);
    const winningTeams = [...new Set(results.filter((r) => r.teamPosition === 1).map((r) => r.teamNumber))];

    return {
      ...season,
      champions:
        season.format === "PAIRS"
          ? winningTeams.map((team) =>
              results
                .filter((r) => r.teamNumber === team)
                .map(nameOf)
                .join(" e "),
            )
          : results.filter((r) => r.position === 1 && r.removedFromWeek === null).map(nameOf),
      playoffChampions: bracket?.champions.map((id) => nameOf(results.find((r) => r.userId === id))) ?? [],
    };
  });
}

// Server-side permission check used by admin actions
export async function isGroupAdmin(groupId: string, user: { id: string; isSuperAdmin: boolean }) {
  if (user.isSuperAdmin) return true;
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    select: { role: true },
  });
  return membership?.role === "ADMIN";
}

// What the invite page shows before the user joins
export async function getGroupByInviteCode(inviteCode: string) {
  return prisma.group.findUnique({
    where: { inviteCode },
    select: { id: true, name: true, _count: { select: { members: true } } },
  });
}
