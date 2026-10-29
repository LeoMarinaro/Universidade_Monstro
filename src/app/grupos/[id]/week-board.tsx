import Link from "next/link";
import { addDays, dateToKey, formatDayMonth, type DayKey } from "@/lib/dates";
import type { getSeasonStandings } from "@/lib/standings";

type Standings = Awaited<ReturnType<typeof getSeasonStandings>>;

const WEEKDAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

// One season week, day by day: green = trained, yellow row = off week
export function WeekBoard({
  standings,
  startDate,
  weeks,
  today,
  groupId,
}: {
  standings: Standings;
  startDate: Date;
  weeks: number;
  today: DayKey;
  groupId: string;
}) {
  const { currentWeek, rows } = standings;

  if (currentWeek < 1) {
    return (
      <p className="text-sm text-muted">
        A temporada começa em {formatDayMonth(dateToKey(startDate))}.
      </p>
    );
  }

  // After the last week, keep showing the last one
  const week = Math.min(currentWeek, weeks);
  const monday = addDays(dateToKey(startDate), (week - 1) * 7);
  const dayKeys = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const active = rows.filter((row) => row.removedFromWeek === null || week < row.removedFromWeek);
  const offNext = rows.filter((row) => row.offWeek === week + 1).map((row) => row.name);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold">
        Semana {week}{" "}
        <span className="font-normal text-muted">
          · {formatDayMonth(dayKeys[0])} a {formatDayMonth(dayKeys[6])}
        </span>
      </h2>

      <div className="rounded-2xl border border-line-soft bg-surface py-2">
        <div
          aria-hidden="true"
          className="grid grid-cols-[minmax(0,1fr)_repeat(7,22px)_24px] items-center gap-1.5 px-3.5 pt-1 pb-1.5 text-center text-xs text-muted"
        >
          <span />
          {WEEKDAY_LETTERS.map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
          <span />
        </div>
        <ul>
          {active.map((row) => {
            const off = row.offWeek === week;
            return (
              <li
                key={row.userId}
                className="grid grid-cols-[minmax(0,1fr)_repeat(7,22px)_24px] items-center gap-1.5 border-t border-raised px-3.5 py-2.25 text-center"
              >
                <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                  <Link
                    href={`/grupos/${groupId}/membros/${row.userId}`}
                    className="max-w-full truncate text-sm font-medium hover:text-accent"
                  >
                    {row.name}
                  </Link>
                  {off && <span className="text-[10px] font-bold tracking-wide text-off">SEMANA OFF</span>}
                </span>
                {dayKeys.map((day) => {
                  const future = day > today;
                  const trained = row.days.has(day);
                  return (
                    <span key={day} className="flex justify-center">
                      <span
                        className={`size-5 rounded-full ${
                          off
                            ? "bg-off"
                            : future
                              ? "border border-dashed border-line"
                              : trained
                                ? "bg-accent"
                                : "bg-empty"
                        }`}
                      />
                    </span>
                  );
                })}
                <span className={`text-right text-[15px] font-semibold ${off ? "text-off" : ""}`}>
                  {row.weekly[week - 1] ?? 0}
                  <span className="sr-only"> {off ? "pela média" : "treinos"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-accent" />
          Treinou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-empty" />
          Sem treino
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-off" />
          Semana off (vale a média)
        </span>
      </div>

      {week < weeks && (
        <p className="text-[13px] leading-relaxed text-muted">
          Semana off na S{week + 1}:{" "}
          <strong className="font-semibold text-ink">{offNext.length > 0 ? offNext.join(", ") : "ninguém"}</strong>
        </p>
      )}
    </section>
  );
}
