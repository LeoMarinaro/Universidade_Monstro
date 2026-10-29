"use client";

import { useTransition } from "react";
import { markWorkoutToday, unmarkWorkoutToday } from "./actions";

export function TrainedTodayButton({ trainedToday }: { trainedToday: boolean }) {
  const [pending, startTransition] = useTransition();

  if (trainedToday) {
    return (
      <div className="flex flex-col gap-1">
        <p className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-accent bg-surface text-[17px] font-semibold text-accent">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Treino de hoje registrado
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => unmarkWorkoutToday())}
          className="min-h-11 self-center px-3 text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
        >
          {pending ? "Desfazendo…" : "Desfazer"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markWorkoutToday())}
      className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-accent text-[17px] font-semibold text-page hover:bg-accent-hover disabled:opacity-60"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
      {pending ? "Registrando…" : "Treinei hoje"}
    </button>
  );
}
