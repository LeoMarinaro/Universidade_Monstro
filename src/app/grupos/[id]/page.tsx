import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { todayKey } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { seasonSummary } from "@/lib/seasons";
import { getCurrentUser } from "@/lib/session";
import { CopyInviteButton } from "./copy-invite-button";

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
            {group.members.length} {group.members.length === 1 ? "competidor" : "competidores"}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-surface p-4">
        {group.currentSeason ? (
          <p className="font-display text-lg font-bold">{seasonSummary(group.currentSeason, todayKey())}</p>
        ) : (
          <>
            <p className="font-display text-lg font-bold">Nenhuma temporada ainda</p>
            <p className="text-sm leading-relaxed text-muted">
              {group.isAdmin
                ? "Convide a galera e depois crie a primeira temporada."
                : "Quando o admin criar a primeira temporada, a tabela aparece aqui."}
            </p>
          </>
        )}
      </section>

      {group.isAdmin && group.inviteCode && (
        <section aria-label="Ações do admin" className="flex flex-col gap-2">
          <span className="text-xs tracking-wider text-muted uppercase">Admin</span>
          <CopyInviteButton inviteCode={group.inviteCode} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Membros</h2>
        <ul className="rounded-2xl border border-line-soft bg-surface py-1">
          {group.members.map(({ role, user: member }) => (
            <li
              key={member.id}
              className="flex items-center justify-between border-b border-raised px-4 py-2.5 last:border-b-0"
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-line-soft text-[13px] font-semibold"
                >
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[15px] font-medium">
                  {member.name}
                  {member.id === user.id && <span className="text-muted"> (você)</span>}
                </span>
              </span>
              {role === "ADMIN" && (
                <span className="rounded-full border border-accent px-2 py-0.5 text-[11px] font-bold text-accent">
                  ADMIN
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
