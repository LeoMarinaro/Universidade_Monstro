"use client";

import { useTransition } from "react";
import { finalizeSeason } from "../season-actions";

type Props = { seasonId: string; seasonLabel: string; weeksLeft: number; currentWeek: number };

// Weeks left > 0 = ending early: the season then ends in the current week
export function FinalizeSeasonButton({ seasonId, seasonLabel, weeksLeft, currentWeek }: Props) {
  const [pending, startTransition] = useTransition();
  const early = weeksLeft > 0;

  function handleClick() {
    const message = early
      ? `A ${seasonLabel} ainda não terminou (falta${weeksLeft === 1 ? "" : "m"} ${weeksLeft} semana${weeksLeft === 1 ? "" : "s"}). ` +
        `Encerrar agora? Ela termina na S${currentWeek} e a classificação de agora fica salva.`
      : `Encerrar a ${seasonLabel}? A classificação final fica salva e não muda mais. ` +
        "Adicione os treinos atrasados antes de encerrar.";
    if (window.confirm(message)) startTransition(() => finalizeSeason(seasonId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`flex h-12 items-center justify-center rounded-xl text-sm font-semibold disabled:opacity-60 ${
        early ? "border border-line bg-surface text-ink/85 hover:border-muted" : "bg-accent text-page hover:bg-accent-hover"
      }`}
    >
      {pending ? "Encerrando…" : early ? `Encerrar ${seasonLabel} antes do fim` : `Encerrar ${seasonLabel}`}
    </button>
  );
}
