import Link from "next/link";
import { Avatar } from "@/components/avatar";

export type PairRow = {
  teamNumber: number;
  position: number;
  points: number;
  out: boolean;
  members: {
    userId: string | null; // null: the account was deleted for good
    name: string;
    image: string | null;
    points: number;
    leftAtWeek: number | null;
  }[];
};

// Gold, silver, bronze for the podium
const PODIUM_COLORS = ["text-off", "text-ink/85", "text-[#e39b5b]"];

// The pairs' classification; used for running and finished seasons
export function PairsTable({ pairs, meId, groupId }: { pairs: PairRow[]; meId: string; groupId: string }) {
  if (pairs.length === 0) {
    return <p className="text-sm text-muted">Nenhuma dupla nesta temporada.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {pairs.map((pair) => {
        const mine = pair.members.some((member) => member.userId === meId);
        return (
          <li
            key={pair.teamNumber}
            className={`flex flex-col gap-2 rounded-2xl border p-3 ${
              mine ? "border-accent bg-raised" : "border-line-soft bg-surface"
            } ${pair.out ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`font-display text-base font-bold ${
                  pair.out ? "text-muted" : (PODIUM_COLORS[pair.position - 1] ?? "text-muted")
                }`}
              >
                {pair.out ? "–" : `${pair.position}º`}
              </span>
              <span className="font-display text-xl font-bold">
                {pair.points}
                <span className="sr-only"> pontos</span>
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {pair.members.map((member, index) => {
                const content = (
                  <>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={member.name} image={member.image} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-medium">
                          {member.name}
                          {member.userId === meId && <span className="text-muted"> (você)</span>}
                        </span>
                        {member.leftAtWeek !== null && (
                          <span className="text-[11px] text-muted">saiu na S{member.leftAtWeek}</span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">{member.points}</span>
                  </>
                );
                const rowClass = "flex items-center justify-between gap-3";
                return (
                  <li key={member.userId ?? `deleted-${index}`}>
                    {member.userId ? (
                      <Link href={`/grupos/${groupId}/membros/${member.userId}`} className={`${rowClass} hover:text-accent`}>
                        {content}
                      </Link>
                    ) : (
                      <div className={rowClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
