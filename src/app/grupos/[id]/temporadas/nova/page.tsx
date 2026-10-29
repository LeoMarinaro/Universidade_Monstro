import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { addDays, todayKey, weekStart } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createSeason } from "../../../season-actions";
import { SeasonForm } from "./season-form";

export const metadata: Metadata = { title: "Nova temporada · Universidade Monstro" };

export default function NewSeasonPage({ params }: PageProps<"/grupos/[id]/temporadas/nova">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <NewSeasonContent params={params} />
      </Suspense>
    </main>
  );
}

async function NewSeasonContent({ params }: Pick<PageProps<"/grupos/[id]/temporadas/nova">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  if (!group || !group.isAdmin) notFound();

  const header = (
    <BackHeader href={`/grupos/${group.id}`} label={`${group.name} · Admin`} backLabel="Voltar para o grupo" />
  );

  if (group.currentSeason) {
    return (
      <>
        {header}
        <section className="flex flex-col gap-3">
          <h1 className="font-display text-[26px] font-bold">Já tem temporada rodando</h1>
          <p className="text-sm leading-relaxed text-muted">
            O grupo só pode ter uma temporada por vez. Encerre a T{group.currentSeason.number} para
            criar a próxima.
          </p>
          <Link href={`/grupos/${group.id}`} className="font-semibold text-accent hover:text-accent-hover">
            Voltar para o grupo
          </Link>
        </section>
      </>
    );
  }

  const last = await prisma.season.aggregate({ where: { groupId: group.id }, _max: { number: true } });
  const nextNumber = (last._max.number ?? 0) + 1;

  return (
    <>
      {header}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Nova temporada</h1>
        <p className="text-sm leading-relaxed text-muted">
          A temporada começa numa segunda-feira. Pode ser uma data passada, se ela já começou fora do
          site.
        </p>
      </div>
      <SeasonForm
        action={createSeason.bind(null, group.id)}
        nextNumber={nextNumber}
        // Default: next Monday
        defaultStart={addDays(weekStart(todayKey()), 7)}
        members={group.members.map(({ user: member }) => ({ id: member.id, name: member.name }))}
      />
    </>
  );
}
