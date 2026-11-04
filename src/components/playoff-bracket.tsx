import type { PlayoffBracket as Bracket, PlayoffMatch, PlayoffPhase } from "@/lib/formats/playoffs";

const DELETED_ACCOUNT = "Conta deletada";

// The play-offs: champion, qualifying and each phase's confrontations.
// `seasonEnded`: the season is finalized, so a phase that didn't finish won't.
export function PlayoffBracket({
  bracket,
  names,
  meId,
  seasonEnded = false,
}: {
  bracket: Bracket;
  names: Record<string, string>;
  meId: string;
  seasonEnded?: boolean;
}) {
  const nameOf = (userId: string) => names[userId] ?? DELETED_ACCOUNT;
  const final = bracket.phases.at(-1)?.matches[0];

  const qualifying = (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">Classificação</h3>
        <span className="text-[13px] text-muted">
          S1 a S{bracket.qualifyingWeeks} · {bracket.qualifyingDone ? "encerrada" : "em andamento"}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        {bracket.qualifyingDone
          ? `Os ${bracket.qualifiers} melhores passaram; quem empatou na última vaga também.`
          : `Os ${bracket.qualifiers} melhores passam; quem empatar na última vaga também. Por enquanto:`}
      </p>
      <ol className="rounded-2xl border border-line-soft bg-surface py-1">
        {bracket.ranking.map((entry, index) => (
          <li
            key={entry.userId}
            className={`flex items-center justify-between gap-3 border-b border-raised px-4 py-2.5 text-sm last:border-b-0 ${
              entry.qualified ? "" : "opacity-55"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="w-6 shrink-0 font-display font-bold text-muted">{index + 1}º</span>
              <span className="truncate font-medium">
                {nameOf(entry.userId)}
                {entry.userId === meId && <span className="text-muted"> (você)</span>}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-semibold">{entry.total}</span>
              {entry.qualified && (
                <span className="text-xs font-semibold text-accent">
                  {bracket.qualifyingDone ? "passou" : "dentro"}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );

  // What's happening now comes first: the qualifying while it runs, then the
  // latest phase on top
  const phases = bracket.qualifyingDone ? [...bracket.phases].reverse() : bracket.phases;

  return (
    <div className="flex flex-col gap-5">
      {bracket.champions.length > 0 && (
        <section className="flex flex-col gap-1 rounded-2xl border border-off bg-off-soft p-4 text-center">
          <span className="text-xs font-semibold tracking-wider text-off uppercase">
            {bracket.champions.length > 1 ? "Campeões dos play-offs" : "Campeão dos play-offs"}
          </span>
          <span className="font-display text-2xl font-bold">{bracket.champions.map(nameOf).join(" e ")}</span>
          {final?.decidedBySeasonTotal && (
            <span className="text-xs text-ink/85">Final empatada: decidida pelo total da temporada</span>
          )}
          {bracket.champions.length > 1 && (
            <span className="text-xs text-ink/85">Empate na final e no total da temporada</span>
          )}
        </section>
      )}

      {!bracket.qualifyingDone && qualifying}

      {phases.map((phase) => (
        <PhaseSection
          key={phase.name}
          phase={phase}
          nameOf={nameOf}
          meId={meId}
          seasonEnded={seasonEnded}
        />
      ))}

      {bracket.qualifyingDone && qualifying}
    </div>
  );
}

function PhaseSection({
  phase,
  nameOf,
  meId,
  seasonEnded,
}: {
  phase: PlayoffPhase;
  nameOf: (userId: string) => string;
  meId: string;
  seasonEnded: boolean;
}) {
  const status =
    phase.status === "finished"
      ? "encerrada"
      : seasonEnded
        ? "não terminou"
        : phase.status === "running"
          ? "em andamento"
          : "ainda não começou";

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">{phase.name}</h3>
        <span className="text-[13px] whitespace-nowrap text-muted">
          S{phase.startWeek}
          {phase.endWeek > phase.startWeek && ` a S${phase.endWeek}`} · {status}
        </span>
      </div>
      {phase.matches.length === 0 ? (
        <p className="text-sm text-muted">
          {seasonEnded ? "Não foi disputada." : "Os confrontos saem quando a fase anterior terminar."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {phase.matches.map((match, index) => (
            <MatchCard key={index} match={match} nameOf={nameOf} meId={meId} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MatchCard({
  match,
  nameOf,
  meId,
}: {
  match: PlayoffMatch;
  nameOf: (userId: string) => string;
  meId: string;
}) {
  const decided = match.winners.length > 0;

  return (
    <li className="rounded-2xl border border-line-soft bg-surface py-1">
      {match.members.map((member) => {
        const won = match.winners.includes(member.userId);
        return (
          <div
            key={member.userId}
            className={`flex items-center justify-between gap-3 border-b border-raised px-4 py-2.5 text-[15px] last:border-b-0 ${
              decided && !won ? "text-muted" : ""
            }`}
          >
            <span className={`min-w-0 truncate ${won ? "font-semibold text-accent" : "font-medium"}`}>
              {nameOf(member.userId)}
              {member.userId === meId && <span className="font-normal text-muted"> (você)</span>}
              {won && <span className="sr-only"> (avançou)</span>}
            </span>
            <span className={`shrink-0 font-display text-[17px] font-bold ${won ? "text-accent" : ""}`}>
              {member.score}
              <span className="sr-only"> treinos</span>
            </span>
          </div>
        );
      })}
    </li>
  );
}
