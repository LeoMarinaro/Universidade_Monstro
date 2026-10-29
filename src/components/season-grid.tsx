import { addDays, dateToKey, type DayKey } from "@/lib/dates";

const WEEKDAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

// One person's season in the group, week by week (latest on top): green =
// counted workout, a whole yellow row = off week (counts the average)
export function SeasonGrid({
  startDate,
  lastWeek,
  today,
  days,
  weekly,
  offWeek,
}: {
  startDate: Date;
  lastWeek: number;
  today: DayKey;
  days: Set<DayKey>;
  weekly: number[];
  offWeek: number | null;
}) {
  const start = dateToKey(startDate);
  const weeks = Array.from({ length: lastWeek }, (_, index) => lastWeek - index);

  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-line-soft bg-surface px-3 py-4.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold">Treinos na temporada</h2>
        <span className="text-[13px] text-muted">S1 – S{lastWeek}</span>
      </div>

      <div
        aria-hidden="true"
        className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))_28px] px-1 text-center text-xs text-muted"
      >
        <span />
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
        <span />
      </div>

      <ol className="flex flex-col">
        {weeks.map((week, index) => {
          const off = offWeek === week;
          const monday = addDays(start, (week - 1) * 7);
          return (
            <li
              key={week}
              className={`grid grid-cols-[40px_repeat(7,minmax(0,1fr))_28px] items-center rounded-[10px] px-1 py-1.5 text-center ${index === 0 ? "bg-raised" : ""}`}
            >
              <span
                className={`text-left text-[13px] font-semibold ${off ? "text-off" : index === 0 ? "text-accent" : "text-muted"}`}
              >
                S{week}
              </span>
              {Array.from({ length: 7 }, (_, weekday) => {
                const day = addDays(monday, weekday);
                return (
                  <span key={day} className="flex justify-center">
                    <span
                      className={`size-6.5 rounded-full ${
                        off
                          ? "bg-off"
                          : day > today
                            ? "border border-dashed border-line"
                            : days.has(day)
                              ? "bg-accent"
                              : "bg-empty"
                      }`}
                    />
                  </span>
                );
              })}
              <span className={`text-right text-sm font-semibold ${off ? "text-off" : ""}`}>
                {weekly[week - 1] ?? 0}
                <span className="sr-only"> {off ? "pela média (semana off)" : "treinos"}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-2 px-1 pt-1 text-xs text-muted">
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
    </section>
  );
}
