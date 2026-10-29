import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { BackHeader } from "@/components/back-header";
import { todayKey } from "@/lib/dates";
import { getFinishedSeasons, getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { FORMAT_LABELS } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { getSeasonStandings } from "@/lib/standings";
import { CopyInviteButton } from "./copy-invite-button";
import { FinalizeSeasonButton } from "./finalize-season-button";
import { GroupTabs } from "./group-tabs";
import { LeaveGroup } from "./leave-group";
import { MemberMenu } from "./member-menu";
import { RegenerateInviteButton } from "./regenerate-invite-button";
import { SeasonsList } from "./seasons-list";
import { OffWeekControl } from "./off-week-control";
import { RankingTable } from "./ranking-table";
import { WeekBoard } from "./week-board";

export default function GroupPage({ params }: PageProps<"/grupos/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      <BackHeader href="/" label="Universidade Monstro" backLabel="Voltar para o início" />

      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <GroupContent params={params} />
      </Suspense>
    </main>
  );
}

async function GroupContent({ params }: Pick<PageProps<"/grupos/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  if (!group) notFound();

  const season = group.currentSeason;
  const today = todayKey();
  const standings = season ? await getSeasonStandings({ ...season, groupId: group.id }, today) : null;
  const finishedSeasons = await getFinishedSeasons(group.id);
  const pendingRequests = group.isAdmin
    ? await prisma.workoutRequest.count({ where: { groupId: group.id, status: "PENDING" } })
    : 0;
  const myRow = standings?.rows.find((row) => row.userId === user.id);

  // People competing in the running season (not removed), for the members menu
  const inSeason = new Set(
    standings?.rows.filter((row) => row.removedFromWeek === null).map((row) => row.userId) ?? [],
  );
  const members = (
    <MemberList
      members={group.members}
      meId={user.id}
      groupId={group.id}
      viewerIsAdmin={group.isAdmin}
      inSeason={season && standings && standings.currentWeek <= season.weeks ? inSeason : new Set()}
    />
  );

  return (
    <>
      <section className="flex items-center gap-3.5">
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-line-soft font-display text-2xl font-bold text-accent"
        >
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-bold">{group.name}</h1>
          <p className="text-sm text-muted">
            {group.members.length} {group.members.length === 1 ? "membro" : "membros"}
          </p>
        </div>
      </section>

      {season && standings ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-lg font-bold">{season.name ?? `Temporada ${season.number}`}</span>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-page">
              {FORMAT_LABELS[season.format]}
            </span>
          </div>
          <SeasonProgress currentWeek={standings.currentWeek} weeks={season.weeks} />
          {myRow && season.offWeekEnabled && myRow.removedFromWeek === null && (
            <OffWeekControl
              seasonId={season.id}
              offWeek={myRow.offWeek}
              currentWeek={standings.currentWeek}
              weeks={season.weeks}
            />
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-2xl border border-line-soft bg-surface p-4">
          <p className="font-display text-lg font-bold">Nenhuma temporada em andamento</p>
          <p className="text-sm leading-relaxed text-muted">
            {group.isAdmin
              ? "Convide a galera e depois crie a temporada."
              : "Quando o admin criar a temporada, a tabela aparece aqui."}
          </p>
        </section>
      )}

      {group.isAdmin && (
        <section aria-label="Ações do admin" className="flex flex-col gap-2">
          <span className="text-xs tracking-wider text-muted uppercase">Admin</span>
          {pendingRequests > 0 && (
            <Link
              href={`/grupos/${group.id}/pedidos`}
              className="flex h-12 items-center justify-between rounded-xl border border-off bg-off-soft px-4 text-sm font-semibold text-off"
            >
              {pendingRequests === 1 ? "1 pedido de treino" : `${pendingRequests} pedidos de treino`}
              <span aria-hidden="true">›</span>
            </Link>
          )}
          {!season && (
            <Link
              href={`/grupos/${group.id}/temporadas/nova`}
              className="flex h-12 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-page hover:bg-accent-hover"
            >
              Criar temporada
            </Link>
          )}
          {season && standings && standings.currentWeek >= 1 && (
            <FinalizeSeasonButton
              seasonId={season.id}
              seasonLabel={`T${season.number}`}
              weeksLeft={Math.max(season.weeks - standings.currentWeek, 0)}
              currentWeek={standings.currentWeek}
            />
          )}
          {season && (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/grupos/${group.id}/treinos`}
                className="flex h-12 items-center justify-center rounded-xl border border-line bg-surface text-sm font-medium text-ink/85 hover:border-muted"
              >
                Editar treinos
              </Link>
              <Link
                href={`/grupos/${group.id}/temporadas/editar`}
                className="flex h-12 items-center justify-center rounded-xl border border-line bg-surface text-sm font-medium text-ink/85 hover:border-muted"
              >
                Editar temporada
              </Link>
            </div>
          )}
          {season?.offWeekEnabled && (
            <Link
              href={`/grupos/${group.id}/semanas-off`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-medium text-ink/85 hover:border-muted"
            >
              <span aria-hidden="true" className="size-2.5 rounded-full bg-off" />
              Semanas off
            </Link>
          )}
          {group.inviteCode && (
            <>
              <CopyInviteButton inviteCode={group.inviteCode} />
              <RegenerateInviteButton groupId={group.id} />
            </>
          )}
        </section>
      )}

      {season || finishedSeasons.length > 0 ? (
        <GroupTabs
          tabs={[
            ...(season && standings
              ? [
                  {
                    id: "tabela",
                    label: "Tabela",
                    content: <RankingTable standings={standings} meId={user.id} groupId={group.id} />,
                  },
                  {
                    id: "semana",
                    label: "Semana",
                    content: (
                      <WeekBoard
                        standings={standings}
                        startDate={season.startDate}
                        weeks={season.weeks}
                        today={today}
                        groupId={group.id}
                      />
                    ),
                  },
                ]
              : []),
            {
              id: "temporadas",
              label: "Temporadas",
              content: <SeasonsList groupId={group.id} running={season} finished={finishedSeasons} />,
            },
            { id: "membros", label: "Membros", content: members },
          ]}
        />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold">Membros</h2>
          {members}
        </section>
      )}

      {group.myRole && (
        <footer className="mt-4 flex flex-col border-t border-line-soft pt-4">
          <LeaveGroup groupId={group.id} groupName={group.name} situation={leaveSituation(group, user.id)} />
        </footer>
      )}
    </>
  );
}

function leaveSituation(
  group: { myRole: string | null; members: { role: string; user: { id: string } }[] },
  meId: string,
) {
  const others = group.members.filter((member) => member.user.id !== meId);
  if (others.length === 0) return "last";
  if (group.myRole === "ADMIN" && !others.some((member) => member.role === "ADMIN")) return "blocked";
  return "normal";
}

function SeasonProgress({ currentWeek, weeks }: { currentWeek: number; weeks: number }) {
  if (currentWeek < 1) return <p className="text-[13px] text-muted">Ainda não começou · {weeks} semanas</p>;
  if (currentWeek > weeks) return <p className="text-[13px] text-muted">Aguardando o admin encerrar</p>;

  const left = weeks - currentWeek;
  return (
    <>
      <div className="flex justify-between text-[13px] text-muted">
        <span>
          Semana {currentWeek} de {weeks}
        </span>
        <span>{left === 0 ? "última semana" : `faltam ${left} ${left === 1 ? "semana" : "semanas"}`}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso da temporada"
        aria-valuemin={0}
        aria-valuemax={weeks}
        aria-valuenow={currentWeek}
        className="h-2 overflow-hidden rounded bg-line-soft"
      >
        <div className="h-2 rounded bg-accent" style={{ width: `${(currentWeek / weeks) * 100}%` }} />
      </div>
    </>
  );
}

type Member = { role: "ADMIN" | "COMPETITOR"; user: { id: string; name: string; image: string | null } };

function MemberList({
  members,
  meId,
  groupId,
  viewerIsAdmin,
  inSeason,
}: {
  members: Member[];
  meId: string;
  groupId: string;
  viewerIsAdmin: boolean;
  inSeason: Set<string>;
}) {
  const adminCount = members.filter((member) => member.role === "ADMIN").length;

  return (
    <ul className="rounded-2xl border border-line-soft bg-surface py-1">
      {members.map(({ role, user: member }) => (
        <li
          key={member.id}
          className="flex min-h-14 items-center justify-between gap-2 border-b border-raised py-1.5 pr-1.5 pl-4 last:border-b-0"
        >
          <span className="flex items-center gap-2.5">
            <Avatar name={member.name} image={member.image} />
            <Link href={`/grupos/${groupId}/membros/${member.id}`} className="text-[15px] font-medium hover:text-accent">
              {member.name}
              {member.id === meId && <span className="text-muted"> (você)</span>}
            </Link>
          </span>
          <span className="flex items-center gap-1">
            {role === "ADMIN" && (
              <span className="rounded-full border border-accent px-2 py-0.5 text-[11px] font-bold text-accent">
                ADMIN
              </span>
            )}
            {viewerIsAdmin && member.id !== meId && (
              <MemberMenu
                groupId={groupId}
                userId={member.id}
                name={member.name}
                isAdmin={role === "ADMIN"}
                inSeason={inSeason.has(member.id)}
                canRemove={role !== "ADMIN" || adminCount > 1}
              />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
