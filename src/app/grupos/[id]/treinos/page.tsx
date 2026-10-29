import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { addDays, dateToKey, formatDayMonth, keyToDate, todayKey } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { seasonWeek } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { WeekEditor } from "./week-editor";

export const metadata: Metadata = { title: "Editar treinos · Universidade Monstro" };

type Props = PageProps<"/grupos/[id]/treinos">;

export default function WorkoutEditorPage({ params, searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <EditorContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function EditorContent({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const { semana } = await searchParams;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  const season = group?.currentSeason;
  if (!group || !group.isAdmin || !season) notFound();

  const today = todayKey();
  const header = (
    <BackHeader href={`/grupos/${group.id}`} label={`${group.name} · Admin`} backLabel="Voltar para o grupo" />
  );

  // Weeks that can be edited: S1 up to the current week (or the last one)
  const lastEditable = Math.min(seasonWeek(season.startDate, today), season.weeks);
  if (lastEditable < 1) {
    return (
      <>
        {header}
        <p className="text-sm text-muted">
          A T{season.number} começa em {formatDayMonth(dateToKey(season.startDate))}. Os treinos
          podem ser editados a partir daí.
        </p>
      </>
    );
  }

  const requested = Number(Array.isArray(semana) ? semana[0] : semana);
  const week = Number.isInteger(requested) && requested >= 1 && requested <= lastEditable ? requested : lastEditable;
  const monday = addDays(dateToKey(season.startDate), (week - 1) * 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));

  const participants = await prisma.seasonParticipant.findMany({
    where: { seasonId: season.id },
    orderBy: { user: { name: "asc" } },
    select: { userId: true, offWeek: true, user: { select: { name: true } } },
  });
  const workouts = await prisma.groupWorkout.findMany({
    where: {
      groupId: group.id,
      userId: { in: participants.map((p) => p.userId) },
      date: { gte: keyToDate(days[0]), lte: keyToDate(days[6]) },
    },
    select: { userId: true, date: true },
  });

  const rows = participants.map((participant) => ({
    userId: participant.userId,
    name: participant.user.name,
    off: participant.offWeek === week,
    trainedDays: workouts.filter((w) => w.userId === participant.userId).map((w) => dateToKey(w.date)),
  }));

  const base = `/grupos/${group.id}/treinos`;

  return (
    <>
      {header}

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Editar treinos</h1>
        <p className="text-sm leading-relaxed text-muted">
          Toque numa bolinha para adicionar ou tirar o treino daquele dia. Muda só a tabela
          deste grupo: o diário da pessoa continua igual.
        </p>
      </div>

      <nav aria-label="Semanas da temporada" className="flex items-center justify-between">
        <WeekArrow href={week > 1 ? `${base}?semana=${week - 1}` : null} label="Semana anterior" direction="back" />
        <span className="text-center">
          <span className="block font-display text-lg font-bold">Semana {week}</span>
          <span className="text-[13px] text-muted">
            {formatDayMonth(days[0])} a {formatDayMonth(days[6])}
          </span>
        </span>
        <WeekArrow
          href={week < lastEditable ? `${base}?semana=${week + 1}` : null}
          label="Próxima semana"
          direction="forward"
        />
      </nav>

      <WeekEditor seasonId={season.id} days={days} today={today} rows={rows} />
    </>
  );
}

function WeekArrow({ href, label, direction }: { href: string | null; label: string; direction: "back" | "forward" }) {
  const icon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "back" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
  const className = "flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink/85";

  if (!href) {
    return (
      <span aria-hidden="true" className={`${className} opacity-35`}>
        {icon}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${className} hover:border-muted`}>
      {icon}
    </Link>
  );
}
