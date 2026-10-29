"use client";

import { useOptimistic, useTransition } from "react";
import { togglePastWorkout } from "@/app/actions";
import { addDays, formatDayMonth, weekStart, type DayKey } from "@/lib/dates";
import { GRID_WEEKS } from "@/lib/grid";

// Weeks start on Monday
const WEEKDAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// The personal diary: weeks in rows (current week on top), one circle per
// day. Past days can be tapped to add or remove a workout; today goes through
// the "Treinei hoje" button; future days are locked.
export function WorkoutGrid({ today, days }: { today: DayKey; days: DayKey[] }) {
  const [, startTransition] = useTransition();
  const [trained, toggleOptimistic] = useOptimistic(new Set(days), (current, day: DayKey) => {
    const next = new Set(current);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    return next;
  });

  function toggle(day: DayKey) {
    startTransition(async () => {
      toggleOptimistic(day);
      await togglePastWorkout(day);
    });
  }

  const thisWeek = weekStart(today);
  const weeks = Array.from({ length: GRID_WEEKS }, (_, index) => {
    const start = addDays(thisWeek, -7 * index);
    const weekDays = Array.from({ length: 7 }, (_, weekday) => addDays(start, weekday));
    return { start, days: weekDays, count: weekDays.filter((day) => trained.has(day)).length };
  });
  const total = weeks.reduce((sum, week) => sum + week.count, 0);

  // Consecutive days up to today (or up to yesterday, if today isn't marked yet)
  let streak = 0;
  let cursor = trained.has(today) ? today : addDays(today, -1);
  while (trained.has(cursor)) {
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
            className={`grid grid-cols-[44px_repeat(7,minmax(0,1fr))_28px] items-center rounded-[10px] px-1 py-0.5 text-center ${index === 0 ? "bg-raised" : ""}`}
          >
            <span className={`text-left text-xs font-semibold ${index === 0 ? "text-accent" : "text-muted"}`}>
              {formatDayMonth(week.start)}
            </span>
            {week.days.map((day, weekday) => {
              const isTrained = trained.has(day);
              const label = `${WEEKDAY_NAMES[weekday]}, ${formatDayMonth(day)}${isTrained ? " · treinou" : ""}`;
              const circle = (
                <span
                  className={`size-6.5 rounded-full ${
                    day > today
                      ? "border border-dashed border-line"
                      : isTrained
                        ? "bg-accent"
                        : "bg-empty"
                  } ${day === today ? "outline-[1.5px] outline-offset-2 outline-ink outline" : ""}`}
                />
              );

              // Only past days are tappable here
              if (day >= today) {
                return (
                  <span key={day} title={label} className="flex h-10 items-center justify-center">
                    {circle}
                  </span>
                );
              }
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isTrained}
                  aria-label={label}
                  onClick={() => toggle(day)}
                  className="flex h-10 items-center justify-center rounded-full"
                >
                  {circle}
                </button>
              );
            })}
            <span className="text-right text-sm font-semibold">
              {week.count}
              <span className="sr-only"> treinos na semana de {formatDayMonth(week.start)}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="px-1 pt-1 text-xs leading-relaxed text-muted">
        Toque num dia que já passou para marcar ou desmarcar. Se o dia for de uma temporada em
        andamento, o admin do grupo precisa aceitar a mudança.
      </p>
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
