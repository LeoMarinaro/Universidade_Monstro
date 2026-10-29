import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { addDays, dateToKey, formatDayMonth } from "@/lib/dates";
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
          user: { select: { name: true, deletedAt: true } },
        },
      },
    },
  });
  if (!season) notFound();
  // The running season lives on the group page
  if (!season.finalizedAt) redirect(`/grupos/${group.id}`);

  const start = dateToKey(season.startDate);
  const end = addDays(start, season.weeks * 7 - 1);

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
