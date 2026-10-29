import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { BackHeader } from "@/components/back-header";
import { SeasonGrid } from "@/components/season-grid";
import { todayKey } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { FORMAT_LABELS, formatAverage, offWeekStatus } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { getSeasonStandings } from "@/lib/standings";

export const metadata: Metadata = { title: "Perfil no grupo · Universidade Monstro" };

type Props = PageProps<"/grupos/[id]/membros/[userId]">;

export default function GroupProfilePage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <GroupProfileContent params={params} />
      </Suspense>
    </main>
  );
}

// One person inside one group: running season, off week, past seasons
async function GroupProfileContent({ params }: Pick<Props, "params">) {
  const { id, userId } = await params;
  const viewer = await getCurrentUser();
  const group = await getGroupForUser(id, viewer);
  if (!group) notFound();

  const person = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, deletedAt: true },
  });
  const history = await prisma.seasonResult.findMany({
    where: { userId, season: { groupId: group.id } },
    orderBy: { season: { number: "desc" } },
    select: {
      position: true,
      points: true,
      removedFromWeek: true,
      season: { select: { number: true, name: true, format: true } },
    },
  });

  const season = group.currentSeason;
  const today = todayKey();
  const standings = season ? await getSeasonStandings({ ...season, groupId: group.id }, today) : null;
  const row = standings?.rows.find((r) => r.userId === userId);
  const isMember = group.members.some((member) => member.user.id === userId);

  // Only people who are or were part of this group have a profile here
  if (!person || person.deletedAt || (!isMember && !row && history.length === 0)) notFound();

  const removed = row ? row.removedFromWeek !== null : false;
  const lastWeek = standings?.lastWeek ?? 0;

  return (
    <>
      <BackHeader
        href={`/grupos/${group.id}`}
        label={season ? `${group.name} · T${season.number}` : group.name}
        backLabel="Voltar para o grupo"
      />

      <section className="flex flex-col items-center gap-2.5 text-center">
        <Avatar
          name={person.name}
          image={person.image}
          className={`size-24 border-[3px] font-display text-[38px] font-bold ${
            row && !removed && row.position === 1 ? "border-off" : "border-accent"
          }`}
        />
        <h1 className="font-display text-[28px] font-bold">{person.name}</h1>
        {row && !removed && (
          <span className="rounded-full bg-off px-3 py-1 text-[13px] font-semibold text-page">
            {row.position}º lugar
          </span>
        )}
        {removed && <span className="text-sm text-muted">Saiu da temporada na S{row?.removedFromWeek}</span>}
        <Link
          href={`/perfil/${person.id}`}
          className="flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Ver perfil geral
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </section>

      {season && standings && row && (
        <>
          {season.offWeekEnabled && (
            <section
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 ${
                row.offWeek !== null ? "border-off bg-off-soft" : "border-line-soft bg-surface"
              }`}
            >
              <span className="flex flex-col gap-0.5">
                <span className={`text-[15px] font-semibold ${row.offWeek !== null ? "text-off" : ""}`}>
                  Semana off
                </span>
                <span className="text-xs text-ink/85">1 por temporada neste grupo</span>
              </span>
              <span
                className={`font-display text-base font-bold ${row.offWeek !== null ? "text-off" : "text-muted"}`}
              >
                {offWeekStatus(row.offWeek, standings.currentWeek)}
              </span>
            </section>
          )}

          <dl className="grid grid-cols-3 gap-2.5">
            <Stat value={String(row.points)} label="pontos" />
            <Stat value={formatAverage(row.points, lastWeek)} label="por semana" />
            <Stat value={String(Math.max(0, ...row.weekly))} label="melhor semana" />
          </dl>

          {lastWeek > 0 ? (
            <SeasonGrid
              startDate={season.startDate}
              lastWeek={lastWeek}
              today={today}
              days={row.days}
              weekly={row.weekly}
              offWeek={row.offWeek}
            />
          ) : (
            <p className="text-sm text-muted">A temporada ainda não começou.</p>
          )}
        </>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold">Temporadas no {group.name}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma temporada encerrada ainda.</p>
        ) : (
          <ul className="rounded-2xl border border-line-soft bg-surface py-1">
            {history.map((result) => (
              <li key={result.season.number}>
                <Link
                  href={`/grupos/${group.id}/temporadas/${result.season.number}`}
                  className="flex items-center justify-between border-b border-raised px-4 py-3 hover:bg-raised"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-medium">
                      {result.season.name ?? `Temporada ${result.season.number}`}
                    </span>
                    <span className="text-xs text-muted">
                      {FORMAT_LABELS[result.season.format]} · {result.points} pontos
                    </span>
                  </span>
                  <span
                    className={`font-display text-[17px] font-bold ${
                      result.removedFromWeek === null && result.position === 1 ? "text-off" : "text-muted"
                    }`}
                  >
                    {result.removedFromWeek === null ? `${result.position}º` : "saiu"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 rounded-2xl border border-line-soft bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-2xl font-bold">{value}</dd>
    </div>
  );
}
