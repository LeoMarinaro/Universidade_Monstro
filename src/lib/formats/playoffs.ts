// Play-offs: a qualifying stage followed by knockout phases, all sized by the
// admin. Kept free of database code, and safe to import in client components.
//
// Ties: at the qualifying cut everyone tied passes, sharing the last seed (which
// makes a confrontation of 3). In a phase everyone tied advances. In the final
// the season's total decides, and if that also ties there's more than one champion.

export type PlayoffConfig = {
  qualifyingWeeks: number;
  qualifiers: number; // 2, 4, 8 or 16: the phase the knockout starts at
  phaseWeeks: number[]; // duration of each phase, first phase first
};

export const QUALIFIER_OPTIONS = [2, 4, 8, 16];

// Phase names for a knockout starting with this many qualifiers, first phase first
export function phaseNames(qualifiers: number) {
  const names = ["Final", "Semifinais", "Quartas de final", "Oitavas de final"];
  return names.slice(0, Math.log2(qualifiers)).reverse();
}

export function parsePlayoffConfig(config: unknown): PlayoffConfig | null {
  const value = config as Partial<PlayoffConfig> | null;
  if (!value || typeof value.qualifyingWeeks !== "number" || typeof value.qualifiers !== "number") return null;
  if (!Array.isArray(value.phaseWeeks)) return null;
  return {
    qualifyingWeeks: value.qualifyingWeeks,
    qualifiers: value.qualifiers,
    phaseWeeks: value.phaseWeeks,
  };
}

export type PlayoffPerson = {
  userId: string;
  weekly: number[]; // counted workouts per week, S1 first (off weeks already applied)
  removedFromWeek: number | null;
};

export type PlayoffMatch = {
  members: { userId: string; score: number }[];
  winners: string[]; // empty until the phase finishes
  decidedBySeasonTotal: boolean; // final only: the phase tied and the season's total decided
};

export type PlayoffPhase = {
  name: string;
  startWeek: number;
  endWeek: number;
  status: "upcoming" | "running" | "finished";
  matches: PlayoffMatch[]; // empty while the previous phase hasn't finished
};

export type PlayoffBracket = {
  qualifyingWeeks: number;
  qualifiers: number;
  qualifyingDone: boolean;
  // Classification order; before the qualifying ends it's provisional
  ranking: { userId: string; total: number; qualified: boolean }[];
  phases: PlayoffPhase[];
  champions: string[];
};

// A finished season keeps its bracket inside Season.config, saved when it ends,
// so it never changes later (renamed or deleted accounts, late edits)
export function readFinalBracket(config: unknown): PlayoffBracket | null {
  return (config as { finalBracket?: PlayoffBracket } | null)?.finalBracket ?? null;
}

function sumWeeks(weekly: number[], startWeek: number, endWeek: number) {
  return weekly.slice(startWeek - 1, endWeek).reduce((sum, count) => sum + count, 0);
}

// Which matches of a phase feed each match of the next one: T7's semifinals are
// quarter a×c and b×d; earlier rounds pair the mirror match, so the round of 16
// leads to quarters 1×8, 2×7, 3×6, 4×5
function nextRoundPairs(matchCount: number): [number, number][] {
  if (matchCount === 4) {
    return [
      [0, 2],
      [1, 3],
    ];
  }
  return Array.from({ length: matchCount / 2 }, (_, index) => [index, matchCount - 1 - index]);
}

// completedWeeks: weeks already over. currentWeek: the week running now.
export function computeBracket(
  people: PlayoffPerson[],
  config: PlayoffConfig,
  completedWeeks: number,
  currentWeek: number,
): PlayoffBracket {
  const { qualifyingWeeks, qualifiers, phaseWeeks } = config;
  const qualifyingDone = completedWeeks >= qualifyingWeeks;
  const byId = new Map(people.map((person) => [person.userId, person]));

  const stillIn = (person: PlayoffPerson, week: number) =>
    person.removedFromWeek === null || person.removedFromWeek > week;

  // Most workouts first; equal totals keep a fixed order (by id), so a tie
  // never reshuffles the confrontations later
  const eligible = people
    .filter((person) => stillIn(person, qualifyingWeeks))
    .map((person) => ({ userId: person.userId, total: sumWeeks(person.weekly, 1, qualifyingWeeks) }))
    .sort((a, b) => b.total - a.total || a.userId.localeCompare(b.userId));

  const cutoff = eligible[qualifiers - 1]?.total;
  const ranking = eligible.map((entry, index) => ({
    ...entry,
    qualified: index < qualifiers || entry.total === cutoff,
  }));

  const names = phaseNames(qualifiers);
  const phases: PlayoffPhase[] = [];
  const champions: string[] = [];

  // Seeds 1..N; everyone tied at the cut shares the last seed
  const passed = ranking.filter((entry) => entry.qualified).map((entry) => entry.userId);
  const seeds: string[][] = Array.from({ length: qualifiers }, (_, index) =>
    index === qualifiers - 1 ? passed.slice(index) : passed.slice(index, index + 1),
  );

  // 1st against last, 2nd against second to last…
  let contestants: string[][] | null = qualifyingDone
    ? Array.from({ length: qualifiers / 2 }, (_, index) => [...seeds[index], ...seeds[qualifiers - 1 - index]])
    : null;

  let startWeek = qualifyingWeeks + 1;
  names.forEach((name, phaseIndex) => {
    const endWeek = startWeek + phaseWeeks[phaseIndex] - 1;
    const isFinal = phaseIndex === names.length - 1;
    const finished = completedWeeks >= endWeek;
    const status = finished ? "finished" : currentWeek >= startWeek ? "running" : "upcoming";

    const matches: PlayoffMatch[] = (contestants ?? []).map((memberIds) => {
      const members = memberIds.map((userId) => ({
        userId,
        score: sumWeeks(byId.get(userId)?.weekly ?? [], startWeek, endWeek),
      }));
      if (!finished) return { members, winners: [], decidedBySeasonTotal: false };

      // Whoever left the season during the phase can't advance
      const active = members.filter((member) => {
        const person = byId.get(member.userId);
        return person ? stillIn(person, endWeek) : false;
      });
      const best = Math.max(...active.map((member) => member.score));
      let winners = active.filter((member) => member.score === best).map((member) => member.userId);
      let decidedBySeasonTotal = false;

      if (isFinal && winners.length > 1) {
        const seasonTotal = (userId: string) => sumWeeks(byId.get(userId)?.weekly ?? [], 1, endWeek);
        const bestTotal = Math.max(...winners.map(seasonTotal));
        const untied = winners.filter((userId) => seasonTotal(userId) === bestTotal);
        decidedBySeasonTotal = untied.length < winners.length;
        winners = untied;
      }
      return { members, winners, decidedBySeasonTotal };
    });

    phases.push({ name, startWeek, endWeek, status, matches });

    if (isFinal && finished) champions.push(...(matches[0]?.winners ?? []));

    // Next phase's confrontations are known once this one finishes
    contestants =
      finished && !isFinal
        ? nextRoundPairs(matches.length).map(([first, second]) => [
            ...matches[first].winners,
            ...matches[second].winners,
          ])
        : null;
    startWeek = endWeek + 1;
  });

  return { qualifyingWeeks, qualifiers, qualifyingDone, ranking, phases, champions };
}
