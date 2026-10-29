import Link from "next/link";
import type { DayKey } from "@/lib/dates";
import type { getUserGroups } from "@/lib/groups";
import { seasonSummary } from "@/lib/seasons";

type Group = Awaited<ReturnType<typeof getUserGroups>>[number];

export function GroupCards({ groups, today }: { groups: Group[]; today: DayKey }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold">Meus grupos</h2>

      {groups.length === 0 && (
        <p className="text-sm leading-relaxed text-muted">
          Você ainda não está em nenhum grupo. Crie um, ou peça o link de convite a um amigo.
        </p>
      )}

      {groups.map((group) => (
        <GroupCard key={group.id} group={group} today={today} />
      ))}

      <Link
        href="/grupos/novo"
        className="flex h-13 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#3a4250] text-[15px] font-medium text-ink/85 hover:border-muted"
      >
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
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Criar grupo
      </Link>
    </section>
  );
}

function GroupCard({ group, today }: { group: Group; today: DayKey }) {
  return (
    <Link
      href={`/grupos/${group.id}`}
      className="flex flex-col gap-3.5 rounded-2xl border border-line-soft bg-surface p-4 hover:border-line"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-line-soft font-display text-lg font-bold text-accent"
          >
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold">{group.name}</span>
            <span className="text-[13px] text-muted">{seasonSummary(group.currentSeason, today)}</span>
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>

      <div className="flex items-center justify-between border-t border-line-soft pt-3 text-xs text-muted">
        <span>
          {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
        </span>
        {group.role === "ADMIN" && (
          <span className="rounded-full border border-accent px-2 py-0.5 font-bold text-accent">
            ADMIN
          </span>
        )}
      </div>
    </Link>
  );
}
