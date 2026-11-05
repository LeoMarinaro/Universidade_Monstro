// Duplas: a pair's points are the sum of both members' points. Someone who
// leaves keeps the points made so far, and the partner goes on adding alone.
// Kept free of database code, so it's easy to test.

export type PairMember = {
  userId: string;
  points: number;
  teamNumber: number | null;
  removedFromWeek: number | null;
};

export type PairStanding = {
  teamNumber: number;
  memberIds: string[];
  points: number;
  position: number;
  out: boolean; // both members left the season: frozen at the bottom
};

export function computePairStandings(people: PairMember[]): PairStanding[] {
  const teams = new Map<number, PairMember[]>();
  for (const person of people) {
    if (person.teamNumber === null) continue;
    teams.set(person.teamNumber, [...(teams.get(person.teamNumber) ?? []), person]);
  }

  const pairs = [...teams].map(([teamNumber, members]) => ({
    teamNumber,
    memberIds: members.map((member) => member.userId),
    points: members.reduce((sum, member) => sum + member.points, 0),
    out: members.every((member) => member.removedFromWeek !== null),
  }));

  // Most points first; equal points share the position (1º, 1º, 3º…)
  pairs.sort((a, b) => Number(a.out) - Number(b.out) || b.points - a.points || a.teamNumber - b.teamNumber);
  return pairs.map((pair) => ({
    ...pair,
    position: pairs.findIndex((other) => other.points === pair.points && other.out === pair.out) + 1,
  }));
}

export type PairAssignment = { valid: true; teams: Map<string, number> } | { valid: false; error: string };

// Checks the pairs chosen when creating a season: an even number of
// participants, each in a pair with exactly one other person
export function validatePairs(participantIds: string[], chosen: Map<string, number>): PairAssignment {
  if (participantIds.length < 2 || participantIds.length % 2 !== 0) {
    return { valid: false, error: "Duplas precisam de um número par de participantes." };
  }

  const pairCount = participantIds.length / 2;
  const sizes = new Map<number, number>();
  for (const id of participantIds) {
    const team = chosen.get(id);
    if (team === undefined || !Number.isInteger(team) || team < 1 || team > pairCount) {
      return { valid: false, error: "Escolha a dupla de cada participante." };
    }
    sizes.set(team, (sizes.get(team) ?? 0) + 1);
  }
  if ([...sizes.values()].some((size) => size !== 2)) {
    return { valid: false, error: "Cada dupla precisa ter exatamente 2 pessoas." };
  }
  return { valid: true, teams: chosen };
}
