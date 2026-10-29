import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { dateToKey, formatDayMonth, todayKey } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { FORMAT_LABELS, seasonWeek } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { deleteSeason, updateSeason } from "../../../season-actions";
import { DeleteSeasonButton } from "./delete-season-button";
import { EditSeasonForm } from "./edit-season-form";

export const metadata: Metadata = { title: "Editar temporada · Universidade Monstro" };

export default function EditSeasonPage({ params }: PageProps<"/grupos/[id]/temporadas/editar">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <EditSeasonContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditSeasonContent({ params }: Pick<PageProps<"/grupos/[id]/temporadas/editar">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  const season = group?.currentSeason;
  if (!group || !group.isAdmin || !season) notFound();

  const latestOff = await prisma.seasonParticipant.aggregate({
    where: { seasonId: season.id },
    _max: { offWeek: true },
  });
  // Same rule as the server: not before the current week or someone's off week
  const minWeeks = Math.max(1, seasonWeek(season.startDate, todayKey()), latestOff._max.offWeek ?? 0);
  const label = `T${season.number}`;

  return (
    <>
      <BackHeader href={`/grupos/${group.id}`} label={`${group.name} · Admin`} backLabel="Voltar para o grupo" />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Editar {label}</h1>
        <p className="text-sm leading-relaxed text-muted">
          {FORMAT_LABELS[season.format]} · início em {formatDayMonth(dateToKey(season.startDate))}
        </p>
      </div>

      <EditSeasonForm
        action={updateSeason.bind(null, season.id)}
        number={season.number}
        name={season.name}
        startDate={dateToKey(season.startDate)}
        weeks={season.weeks}
        minWeeks={minWeeks}
        hasOffWeeks={latestOff._max.offWeek !== null}
      />

      <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-danger/40 p-4">
        <h2 className="text-[15px] font-semibold text-danger">Apagar temporada</h2>
        <p className="text-sm leading-relaxed text-muted">
          Some com a temporada, os participantes e as semanas off. Os treinos de cada pessoa
          continuam salvos. Não dá para desfazer.
        </p>
        <DeleteSeasonButton action={deleteSeason.bind(null, season.id)} seasonLabel={label} />
      </section>
    </>
  );
}
