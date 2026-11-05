import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { PairsTable, type PairRow } from "@/components/pairs-table";
import { PlayoffBracket } from "@/components/playoff-bracket";
import { addDays, dateToKey, formatDayMonth } from "@/lib/dates";
import { readFinalBracket } from "@/lib/formats/playoffs";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { FORMAT_LABELS } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Temporada · Universidade Monstro" };

type Props = PageProps<"/grupos/[id]/temporadas/[number]">;

// Gold, silver, bronze for the podium
const PODIUM_COLORS = ["text-off", "text-ink/85", "text-[#e39b5b]"];

export default function FinishedSeasonPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <FinishedSeasonContent params={params} />
      </Suspense>
    </main>
  );
}

// A finished season, shown from its saved final standings (never recalculated)
async function FinishedSeasonContent({ params }: Pick<Props, "params">) {
  const { id, number } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  const seasonNumber = Number(number);
  if (!group || !Number.isInteger(seasonNumber)) notFound();

  const season = await prisma.season.findUnique({
    where: { groupId_number: { groupId: group.id, number: seasonNumber } },
    select: {
      number: true,
      name: true,
      format: true,
      config: true,
      startDate: true,
      weeks: true,
      finalizedAt: true,
      results: {
        orderBy: [{ removedFromWeek: { sort: "asc", nulls: "first" } }, { position: "asc" }],
        select: {
          userId: true,
          position: true,
          points: true,
          workouts: true,
          offWeek: true,
          removedFromWeek: true,
          teamNumber: true,
          teamPosition: true,
          user: { select: { name: true, image: true, deletedAt: true } },
        },
      },
    },
  });
  if (!season) notFound();
  // The running season lives on the group page
  if (!season.finalizedAt) redirect(`/grupos/${group.id}`);

  const start = dateToKey(season.startDate);
  const end = addDays(start, season.weeks * 7 - 1);
  const bracket = readFinalBracket(season.config);
  const names = Object.fromEntries(
    season.results.flatMap((result) =>
      result.userId && result.user && !result.user.deletedAt ? [[result.userId, result.user.name]] : [],
    ),
  );

  // Saved results grouped back into pairs (points and positions were frozen when it ended)
  const teamNumbers = [...new Set(season.results.flatMap((r) => (r.teamNumber === null ? [] : [r.teamNumber])))];
  const pairs: PairRow[] = teamNumbers
    .map((teamNumber) => {
      const members = season.results.filter((r) => r.teamNumber === teamNumber);
      return {
        teamNumber,
        position: members[0].teamPosition ?? 0,
        points: members.reduce((sum, member) => sum + member.points, 0),
        out: members.every((member) => member.removedFromWeek !== null),
        members: members.map((member) => {
          const active = member.userId && member.user && !member.user.deletedAt;
          return {
            userId: active ? member.userId : null,
            name: active ? member.user!.name : "Conta deletada",
            image: active ? member.user!.image : null,
            points: member.points,
            leftAtWeek: member.removedFromWeek,
          };
        }),
      };
    })
    .sort((a, b) => Number(a.out) - Number(b.out) || a.position - b.position || a.teamNumber - b.teamNumber);

  return (
    <>
      <BackHeader href={`/grupos/${group.id}`} label={group.name} backLabel="Voltar para o grupo" />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">{season.name ?? `Temporada ${season.number}`}</h1>
        <p className="text-sm text-muted">
          {FORMAT_LABELS[season.format]} · {formatDayMonth(start)} a {formatDayMonth(end)} ·{" "}
          {season.weeks} {season.weeks === 1 ? "semana" : "semanas"} · encerrada
        </p>
      </div>

      {bracket && <PlayoffBracket bracket={bracket} names={names} meId={user.id} seasonEnded />}

      {bracket && <h2 className="text-[15px] font-semibold">Classificação geral</h2>}

      {pairs.length > 0 && (
        <>
          <PairsTable pairs={pairs} meId={user.id} groupId={group.id} />
          <h2 className="text-[15px] font-semibold">Classificação individual</h2>
        </>
      )}

      <ol className="flex flex-col gap-1.5">
        {season.results.map((result) => {
          const name = !result.user || result.user.deletedAt ? "Conta deletada" : result.user.name;
          const removed = result.removedFromWeek !== null;
          const content = (
            <>
              <span
                className={`font-display text-base font-bold ${
                  removed ? "text-muted" : (PODIUM_COLORS[result.position - 1] ?? "text-muted")
                }`}
              >
                {removed ? "–" : `${result.position}º`}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-medium">
                  {name}
                  {result.userId === user.id && <span className="text-muted"> (você)</span>}
                </span>
                <span className="text-[11px] text-muted">
                  {result.workouts} {result.workouts === 1 ? "treino" : "treinos"}
                  {result.offWeek !== null && ` · off na S${result.offWeek}`}
                  {removed && ` · saiu na S${result.removedFromWeek}`}
                </span>
              </span>
              <span className="text-right font-display text-[17px] font-bold">
                {result.points}
                <span className="sr-only"> pontos</span>
              </span>
            </>
          );
          const rowClass = `grid grid-cols-[28px_minmax(0,1fr)_52px] items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
            result.userId === user.id ? "border-accent bg-raised" : "border-line-soft bg-surface"
          } ${removed ? "opacity-60" : ""}`;

          return (
            <li key={result.userId ?? `deleted-${result.position}-${result.points}`}>
              {result.userId && result.user && !result.user.deletedAt ? (
                <Link href={`/grupos/${group.id}/membros/${result.userId}`} className={`${rowClass} hover:border-line`}>
                  {content}
                </Link>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
