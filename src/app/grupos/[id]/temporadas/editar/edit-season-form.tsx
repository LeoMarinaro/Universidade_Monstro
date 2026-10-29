"use client";

import { useActionState } from "react";
import { TextField } from "@/components/text-field";
import type { UpdateSeasonState } from "../../../season-actions";

type Props = {
  action: (previous: UpdateSeasonState, formData: FormData) => Promise<UpdateSeasonState>;
  number: number;
  name: string | null;
  startDate: string;
  weeks: number;
  minWeeks: number;
  hasOffWeeks: boolean;
};

const initialState: UpdateSeasonState = { error: null };

export function EditSeasonForm({ action, number, name, startDate, weeks, minWeeks, hasOffWeeks }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4.5">
      <TextField
        label="Nome (opcional)"
        name="name"
        defaultValue={name ?? ""}
        placeholder={`Temporada ${number}`}
        maxLength={40}
      />
      <TextField
        label="Início"
        name="startDate"
        type="date"
        defaultValue={startDate}
        hint={
          hasOffWeeks
            ? "Uma segunda-feira. As semanas off mantêm o número (S3 continua S3), então mudam de data junto."
            : "Uma segunda-feira. Pode ser uma data passada."
        }
        className="h-12 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink [color-scheme:dark] focus:border-accent focus:outline-none"
        required
      />
      <TextField
        label="Duração (semanas)"
        name="weeks"
        type="number"
        defaultValue={weeks}
        min={1}
        max={104}
        hint={`Hoje o mínimo é ${minWeeks} ${minWeeks === 1 ? "semana" : "semanas"}: não dá para terminar antes da semana atual ou da semana off de alguém. Mudando o início, o mínimo muda junto.`}
        required
      />

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-13 rounded-xl bg-accent text-base font-semibold text-page hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
