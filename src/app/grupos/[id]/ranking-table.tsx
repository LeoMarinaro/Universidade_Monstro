import type { getSeasonStandings } from "@/lib/standings";

type Standings = Awaited<ReturnType<typeof getSeasonStandings>>;

// Gold, silver, bronze for the podium
const PODIUM_COLORS = ["text-off", "text-ink/85", "text-[#e39b5b]"];

export function RankingTable({ standings, meId }: { standings: Standings; meId: string }) {
  const { rows, currentWeek, lastWeek } = standings;
  const showThisWeek = currentWeek >= 1 && currentWeek === lastWeek;

  if (rows.length === 0) {
    return <p className="text-sm text-muted">Nenhum participante nesta temporada.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        aria-hidden="true"
        className="grid grid-cols-[28px_minmax(0,1fr)_56px_52px] gap-2.5 px-3 text-[11px] tracking-wide text-muted uppercase"
      >
        <span>#</span>
        <span>Competidor</span>
        <span className="text-center">Semana</span>
        <span className="text-right">Pontos</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const isMe = row.userId === meId;
          const removed = row.removedFromWeek !== null;
          return (
            <li
              key={row.userId}
              className={`grid grid-cols-[28px_minmax(0,1fr)_56px_52px] items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                isMe ? "border-accent bg-raised" : "border-line-soft bg-surface"
              } ${removed ? "opacity-60" : ""}`}
            >
              <span
                className={`font-display text-base font-bold ${
                  removed ? "text-muted" : (PODIUM_COLORS[row.position - 1] ?? "text-muted")
                }`}
              >
                {removed ? "–" : `${row.position}º`}
              </span>
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-line-soft text-[13px] font-semibold"
                >
                  {row.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-medium">
                    {row.name}
                    {isMe && <span className="text-muted"> (você)</span>}
                  </span>
                  {removed && <span className="text-[11px] text-muted">saiu na S{row.removedFromWeek}</span>}
                </span>
              </span>
              <span className="text-center text-[13px] text-muted">
                {showThisWeek && !removed ? `+${row.weekly[currentWeek - 1]}` : "–"}
                <span className="sr-only"> nesta semana</span>
              </span>
              <span className="text-right font-display text-[17px] font-bold">
                {row.points}
                <span className="sr-only"> pontos</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
