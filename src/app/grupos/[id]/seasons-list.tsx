import Link from "next/link";
import type { SeasonFormat } from "@/generated/prisma/client";
import type { getFinishedSeasons } from "@/lib/groups";
import { FORMAT_LABELS } from "@/lib/seasons";

type Finished = Awaited<ReturnType<typeof getFinishedSeasons>>[number];

// "Temporadas" tab: the running season on top, then the finished ones with
// their champion; a finished one opens its saved final standings
export function SeasonsList({
  groupId,
  running,
  finished,
}: {
  groupId: string;
  running: { number: number; name: string | null; format: SeasonFormat } | null;
  finished: Finished[];
}) {
  if (!running && finished.length === 0) {
    return <p className="text-sm text-muted">Nenhuma temporada ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {running && (
        <li className="flex items-center justify-between rounded-2xl border border-accent bg-surface px-4 py-3.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{running.name ?? `Temporada ${running.number}`}</span>
            <span className="text-[13px] text-muted">{FORMAT_LABELS[running.format]} · em andamento</span>
          </span>
          <span className="text-[13px] font-semibold text-accent">Agora</span>
        </li>
      )}
      {finished.map((season) => (
        <li key={season.number}>
          <Link
            href={`/grupos/${groupId}/temporadas/${season.number}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface px-4 py-3.5 hover:border-line"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{season.name ?? `Temporada ${season.number}`}</span>
              <span className="text-[13px] text-muted">{FORMAT_LABELS[season.format]}</span>
            </span>
            <span className="flex items-center gap-1.5 text-right text-[13px] font-semibold text-off">
              {season.champions.length > 0 ? season.champions.join(", ") : "—"}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-muted"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
