"use client";

import { useTransition } from "react";
import { activateOffWeek, cancelOffWeek } from "../season-actions";

type Props = {
  seasonId: string;
  offWeek: number | null;
  currentWeek: number;
  weeks: number;
};

// The competitor's own off week, inside the season card
export function OffWeekControl({ seasonId, offWeek, currentWeek, weeks }: Props) {
  const [pending, startTransition] = useTransition();
  const nextWeek = currentWeek + 1;

  let title = "Sua semana off";
  let detail = "Disponível · 1 por temporada";
  let button: { label: string; run: () => Promise<void>; primary: boolean } | null = null;

  if (offWeek === null) {
    if (nextWeek >= 1 && nextWeek <= weeks) {
      button = { label: `Ativar na S${nextWeek}`, run: () => activateOffWeek(seasonId), primary: true };
    } else {
      detail = "Não dá mais para ativar nesta temporada";
    }
  } else if (offWeek > currentWeek) {
    title = "Semana off ativada";
    detail = `Você estará de off na S${offWeek}`;
    button = { label: "Cancelar", run: () => cancelOffWeek(seasonId), primary: false };
  } else if (offWeek === currentWeek) {
    title = "Você está de semana off";
    detail = "Nesta semana vale a média dos outros";
  } else {
    title = "Semana off";
    detail = `Usada na S${offWeek}`;
  }

  const highlighted = offWeek !== null && offWeek >= currentWeek;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3">
      <span className="flex flex-col gap-0.5">
        <span className={`text-sm font-semibold ${highlighted ? "text-off" : ""}`}>{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </span>
      {button && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(button.run)}
          className={`h-11 shrink-0 rounded-[10px] px-3.5 text-[13px] font-semibold whitespace-nowrap disabled:opacity-60 ${
            button.primary ? "bg-off text-page" : "border border-line text-ink/85"
          }`}
        >
          {pending ? "…" : button.label}
        </button>
      )}
    </div>
  );
}
