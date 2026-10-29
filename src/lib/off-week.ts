// Off week rule, kept free of database code so it's easy to test.
//
// In an off week, a person's count is the average of the OTHER participants'
// workouts that week, rounded down. People also off that week don't enter the
// average. Someone removed from the season counts normally before their
// removal week (so past weeks never change) and as 0 from then on.

export type OffWeekInput = {
  userId: string;
  raw: number[]; // real workouts per week, S1 first
  offWeek: number | null; // S1 = 1
  removedFromWeek: number | null;
};

// Counted workouts per week for weeks 1..lastWeek
export function applyOffWeeks(people: OffWeekInput[], lastWeek: number) {
  const counted = new Map(people.map((person) => [person.userId, [] as number[]]));

  for (let week = 1; week <= lastWeek; week++) {
    const index = week - 1;
    const active = people.filter((p) => p.removedFromWeek === null || week < p.removedFromWeek);
    const working = active.filter((p) => p.offWeek !== week);
    const sum = working.reduce((total, p) => total + (p.raw[index] ?? 0), 0);
    const average = working.length > 0 ? Math.floor(sum / working.length) : 0;

    for (const person of people) {
      const isActive = active.includes(person);
      const value = !isActive ? 0 : person.offWeek === week ? average : (person.raw[index] ?? 0);
      counted.get(person.userId)!.push(value);
    }
  }

  return counted;
}
