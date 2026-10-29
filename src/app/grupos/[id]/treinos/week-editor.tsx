"use client";

import { useOptimistic, useTransition } from "react";
import { formatDayMonth, type DayKey } from "@/lib/dates";
import { toggleWorkoutByAdmin } from "../../season-actions";

const WEEKDAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

type Row = { userId: string; name: string; off: boolean; trainedDays: DayKey[] };

// Tap a circle to add or remove that day's workout. The circle changes right
// away (optimistic) while the server saves.
export function WeekEditor({
  seasonId,
  days,
  today,
  rows,
}: {
  seasonId: string;
  days: DayKey[];
  today: DayKey;
  rows: Row[];
}) {
  const [, startTransition] = useTransition();
  const saved = new Set(rows.flatMap((row) => row.trainedDays.map((day) => `${row.userId}|${day}`)));
  const [trained, toggleOptimistic] = useOptimistic(saved, (current, key: string) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  function toggle(userId: string, day: DayKey) {
    startTransition(async () => {
      toggleOptimistic(`${userId}|${day}`);
      await toggleWorkoutByAdmin(seasonId, userId, day);
    });
  }

  return (
    <div className="rounded-2xl border border-line-soft bg-surface py-2">
      {/* Name on its own line, so each day gets a finger-sized tap area */}
      <div
        aria-hidden="true"
        className="grid grid-cols-7 px-2 pt-1 pb-1 text-center text-xs text-muted"
      >
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </div>
      <ul>
        {rows.map((row) => {
          const count = days.filter((day) => trained.has(`${row.userId}|${day}`)).length;
          return (
            <li key={row.userId} className="flex flex-col gap-0.5 border-t border-raised px-2 pt-2">
              <span className="flex items-baseline justify-between gap-2 px-1.5">
                <span className="truncate text-sm font-medium">
                  {row.name}
                  {row.off && (
                    <span className="ml-2 text-[10px] font-bold tracking-wide text-off">SEMANA OFF</span>
                  )}
                </span>
                <span className="text-sm font-semibold">
                  {count}
                  <span className="sr-only"> treinos</span>
                </span>
              </span>
              <span className="grid grid-cols-7">
              {days.map((day, index) => {
                const isTrained = trained.has(`${row.userId}|${day}`);
                const future = day > today;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={future}
                    aria-pressed={isTrained}
                    aria-label={`${row.name}, ${WEEKDAY_NAMES[index]} ${formatDayMonth(day)}`}
                    onClick={() => toggle(row.userId, day)}
                    className="flex h-11 items-center justify-center disabled:cursor-default"
                  >
                    <span
                      className={`size-6.5 rounded-full ${
                        future
                          ? "border border-dashed border-line"
                          : isTrained
                            ? "bg-accent"
                            : "bg-empty hover:outline hover:outline-1 hover:outline-muted"
                      }`}
                    />
                  </button>
                );
              })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
