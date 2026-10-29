import { addDays, formatDayMonth, weekStart, type DayKey } from "@/lib/dates";
import { GRID_WEEKS } from "@/lib/workouts";

const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

// Weeks in rows (current week on top), one circle per day: the layout chosen
// in the prototype. Shows real workouts only; off weeks belong to groups.
export function WorkoutGrid({ today, days }: { today: DayKey; days: Set<DayKey> }) {
  const thisWeek = weekStart(today);

  const weeks = Array.from({ length: GRID_WEEKS }, (_, index) => {
    const start = addDays(thisWeek, -7 * index);
    const weekDays = Array.from({ length: 7 }, (_, weekday) => {
      const key = addDays(start, weekday);
      return { key, weekday, trained: days.has(key), future: key > today, isToday: key === today };
    });
    return { start, days: weekDays, count: weekDays.filter((day) => day.trained).length };
  });

  const total = weeks.reduce((sum, week) => sum + week.count, 0);

  // Consecutive days up to today (or up to yesterday, if today isn't marked yet)
  let streak = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-line-soft bg-surface px-3 py-4.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold">Seus treinos</h2>
        <span className="text-[13px] text-muted">Últimas {GRID_WEEKS} semanas</span>
      </div>

      <dl className="grid grid-cols-3 gap-2 border-b border-line-soft px-1 pt-1 pb-2.5">
        <Stat value={total} label={`em ${GRID_WEEKS} semanas`} />
        <Stat value={weeks[0].count} label="esta semana" />
        <Stat value={streak} label="dias seguidos" />
      </dl>

      <div aria-hidden="true" className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))_28px] px-1 text-center text-xs text-muted">
        <span />
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
        <span />
      </div>

      <ol className="flex flex-col">
        {weeks.map((week, index) => (
          <li
            key={week.start}
            className={`grid grid-cols-[44px_repeat(7,minmax(0,1fr))_28px] items-center rounded-[10px] px-1 py-1.5 text-center ${index === 0 ? "bg-raised" : ""}`}
          >
            <span className={`text-left text-xs font-semibold ${index === 0 ? "text-accent" : "text-muted"}`}>
              {formatDayMonth(week.start)}
            </span>
            {week.days.map((day) => (
              <span key={day.key} className="flex justify-center">
                <span
                  title={`${WEEKDAY_NAMES[day.weekday]}, ${formatDayMonth(day.key)}${day.trained ? " · treinou" : ""}`}
                  className={`size-6.5 rounded-full ${
                    day.future
                      ? "border border-dashed border-line"
                      : day.trained
                        ? "bg-accent"
                        : "bg-empty"
                  } ${day.isToday ? "outline-[1.5px] outline-offset-2 outline-ink outline" : ""}`}
                />
              </span>
            ))}
            <span className="text-right text-sm font-semibold">
              {week.count}
              <span className="sr-only"> treinos na semana de {formatDayMonth(week.start)}</span>
            </span>
          </li>
        ))}
      </ol>

      <div aria-hidden="true" className="flex gap-4 px-1 pt-1.5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-accent" />
          Treinou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-empty" />
          Sem treino
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full outline-[1.5px] outline-ink outline" />
          Hoje
        </span>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-2xl font-bold">{value}</dd>
    </div>
  );
}
