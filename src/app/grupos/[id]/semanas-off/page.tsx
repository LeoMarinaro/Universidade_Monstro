import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { todayKey } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { setOffWeekByAdmin } from "../../season-actions";

export const metadata: Metadata = { title: "Semanas off · Universidade Monstro" };

export default function OffWeeksPage({ params }: PageProps<"/grupos/[id]/semanas-off">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <OffWeeksContent params={params} />
      </Suspense>
    </main>
  );
}

async function OffWeeksContent({ params }: Pick<PageProps<"/grupos/[id]/semanas-off">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  const season = group?.currentSeason;
  if (!group || !group.isAdmin || !season) notFound();

  const currentWeek = seasonWeek(season.startDate, todayKey());
  const participants = await prisma.seasonParticipant.findMany({
    where: { seasonId: season.id },
    orderBy: { user: { name: "asc" } },
    select: {
      userId: true,
      offWeek: true,
      offWeekSource: true,
      removedFromWeek: true,
      user: { select: { name: true } },
    },
  });
  const weekOptions = Array.from({ length: season.weeks }, (_, index) => index + 1);

  return (
    <>
      <BackHeader href={`/grupos/${group.id}`} label={`${group.name} · Admin`} backLabel="Voltar para o grupo" />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Semanas off</h1>
        <p className="text-sm leading-relaxed text-muted">
          T{season.number} · 1 por competidor. Aqui você coloca, troca ou tira a semana off de
          qualquer um, inclusive de semanas que já passaram.
        </p>
      </div>

      {!season.offWeekEnabled && (
        <p className="rounded-xl border border-line-soft bg-surface p-3.5 text-sm text-muted">
          A semana off está desligada nesta temporada.
        </p>
      )}

      <ul className="rounded-2xl border border-line-soft bg-surface py-1">
        {participants.map((participant) => {
          const status =
            participant.offWeek === null
              ? "Disponível"
              : `${participant.offWeek < currentWeek ? "Usada" : participant.offWeek === currentWeek ? "De off agora" : "Agendada"} · ${
                  participant.offWeekSource === "ADMIN" ? "pelo admin" : "pelo site"
                }`;
          return (
            <li key={participant.userId} className="flex flex-col gap-2 border-b border-raised px-4 py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium">{participant.user.name}</span>
                <span className={`text-xs ${participant.offWeek !== null ? "text-off" : "text-muted"}`}>{status}</span>
              </div>
              <form
                action={setOffWeekByAdmin.bind(null, season.id, participant.userId)}
                className="flex items-center gap-2"
              >
                <label htmlFor={`off-${participant.userId}`} className="sr-only">
                  Semana off de {participant.user.name}
                </label>
                <select
                  id={`off-${participant.userId}`}
                  name="offWeek"
                  defaultValue={participant.offWeek ?? ""}
                  disabled={!season.offWeekEnabled}
                  className="h-11 grow rounded-[10px] border border-line bg-page px-3 text-sm text-ink [color-scheme:dark]"
                >
                  <option value="">Sem semana off</option>
                  {weekOptions.map((week) => (
                    <option key={week} value={week}>
                      S{week}
                      {week === currentWeek ? " (atual)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!season.offWeekEnabled}
                  className="h-11 rounded-[10px] border border-accent px-3.5 text-[13px] font-semibold text-accent hover:bg-raised disabled:opacity-50"
                >
                  Salvar
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
