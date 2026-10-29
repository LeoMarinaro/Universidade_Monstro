import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { WorkoutGrid } from "@/components/workout-grid";
import { todayKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { offWeekStatus, seasonSummary } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { getSeasonStandings } from "@/lib/standings";
import { getRecentWorkoutDays } from "@/lib/workouts";

export const metadata: Metadata = { title: "Perfil · Universidade Monstro" };

type Props = PageProps<"/perfil/[userId]">;

export default function ProfilePage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <ProfileContent params={params} />
      </Suspense>
    </main>
  );
}

// A person's general profile: their diary and one card per group. Privacy:
// others only see the groups they share with the person, and nothing at all
// without a group in common.
async function ProfileContent({ params }: Pick<Props, "params">) {
  const { userId } = await params;
  const viewer = await getCurrentUser();
  const isSelf = viewer.id === userId;

  const person = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, deletedAt: true },
  });
  if (!person || person.deletedAt) notFound();

  const theirGroups = await prisma.membership.findMany({ where: { userId }, select: { groupId: true } });
  let groupIds = theirGroups.map((membership) => membership.groupId);
  if (!isSelf && !viewer.isSuperAdmin) {
    const shared = await prisma.membership.findMany({
      where: { userId: viewer.id, groupId: { in: groupIds } },
      select: { groupId: true },
    });
    groupIds = shared.map((membership) => membership.groupId);
    if (groupIds.length === 0) notFound();
  }

  const today = todayKey();
  const [{ days }, groups] = await Promise.all([
    getRecentWorkoutDays(userId),
    prisma.group.findMany({
      where: { id: { in: groupIds } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        seasons: {
          where: { finalizedAt: null },
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
    }),
  ]);

  // The person's line in each group's running season, if they compete in it
  const cards = await Promise.all(
    groups.map(async (group) => {
      const season = group.seasons[0] ?? null;
      const standings = season ? await getSeasonStandings({ ...season, groupId: group.id }, today) : null;
      const row = standings?.rows.find((r) => r.userId === userId) ?? null;
      return { group, season, standings, row };
    }),
  );

  return (
    <>
      <BackHeader href="/" label="Perfil" backLabel="Voltar para o início" />

      <section className="flex flex-col items-center gap-2 text-center">
        <div
          aria-hidden="true"
          className="flex size-24 items-center justify-center rounded-full border-[3px] border-accent bg-line-soft font-display text-[38px] font-bold"
        >
          {person.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="font-display text-[28px] font-bold">{person.name}</h1>
        <p className="text-sm text-muted">
          {isSelf
            ? `${groups.length} ${groups.length === 1 ? "grupo" : "grupos"}`
            : `${groups.length} ${groups.length === 1 ? "grupo em comum" : "grupos em comum"} com você`}
        </p>
      </section>

      <WorkoutGrid today={today} days={days} editable={isSelf} title={isSelf ? "Seus treinos" : "Treinos"} />

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Grupos</h2>
          {!isSelf && <span className="text-xs text-muted">só grupos em comum</span>}
        </div>

        {cards.map(({ group, season, standings, row }) => (
          <Link
            key={group.id}
            href={`/grupos/${group.id}/membros/${userId}`}
            className="flex flex-col gap-3.5 rounded-2xl border border-line-soft bg-surface p-4 hover:border-line"
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-line-soft font-display text-lg font-bold text-accent"
              >
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{group.name}</span>
                <span className="text-[13px] text-muted">{seasonSummary(season, today)}</span>
              </div>
            </div>

            {season && standings && row && (
              <div className="grid grid-cols-3 gap-2 border-t border-line-soft pt-3">
                <CardStat
                  value={row.removedFromWeek === null ? `${row.position}º` : "saiu"}
                  label="posição"
                  highlight={row.removedFromWeek === null && row.position === 1}
                />
                <CardStat value={String(row.points)} label="pontos" />
                {season.offWeekEnabled ? (
                  <CardStat value={offWeekStatus(row.offWeek, standings.currentWeek)} label="semana off" small />
                ) : (
                  <span />
                )}
              </div>
            )}

            <span className="text-sm font-semibold text-accent">Ver perfil no grupo ›</span>
          </Link>
        ))}
      </section>
    </>
  );
}

function CardStat({
  value,
  label,
  highlight = false,
  small = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <span className="flex flex-col gap-0.5">
      <span
        className={`font-display font-bold ${small ? "text-[13px] leading-5" : "text-xl"} ${highlight ? "text-off" : ""}`}
      >
        {value}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </span>
  );
}
