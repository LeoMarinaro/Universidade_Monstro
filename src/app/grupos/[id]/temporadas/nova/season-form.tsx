"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/text-field";
import type { CreateSeasonState } from "../../../season-actions";

type Props = {
  action: (previous: CreateSeasonState, formData: FormData) => Promise<CreateSeasonState>;
  nextNumber: number;
  defaultStart: string;
  members: { id: string; name: string }[];
};

const initialState: CreateSeasonState = { error: null };

// Only "Pontos brutos" is implemented; the others show what's coming
const FORMATS = [
  { label: "Pontos brutos", description: "Cada treino vale 1 ponto", available: true },
  { label: "Mata-mata", description: "Duelos semanais entre competidores", available: false },
  { label: "Etapas", description: "Blocos de semanas; a colocação dá pontos", available: false },
];

export function SeasonForm({ action, nextNumber, defaultStart, members }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [offWeekEnabled, setOffWeekEnabled] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [offS1, setOffS1] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5.5">
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
        <TextField label="Número" name="number" type="number" min={1} defaultValue={nextNumber} required />
        <TextField label="Nome (opcional)" name="name" placeholder={`Temporada ${nextNumber}`} maxLength={40} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Início"
          name="startDate"
          type="date"
          defaultValue={defaultStart}
          hint="Uma segunda-feira"
          className="h-12 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink [color-scheme:dark] focus:border-accent focus:outline-none"
          required
        />
        <TextField label="Duração (semanas)" name="weeks" type="number" min={1} max={104} placeholder="24" required />
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-sm font-medium text-ink/85">Formato</legend>
        {FORMATS.map((format) => (
          <label
            key={format.label}
            className={`flex items-center gap-3.5 rounded-2xl border bg-surface px-4 py-3.5 ${
              format.available ? "border-accent" : "border-line-soft opacity-55"
            }`}
          >
            <input
              type="radio"
              name="format"
              value={format.label}
              defaultChecked={format.available}
              disabled={!format.available}
              className="size-5 accent-accent"
            />
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{format.label}</span>
              <span className="text-[13px] text-muted">{format.description}</span>
            </span>
            {!format.available && (
              <span className="rounded-full border border-[#3a4250] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-muted">
                Em breve
              </span>
            )}
          </label>
        ))}
      </fieldset>

      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold">Semana off</span>
          <span className="text-[13px] leading-snug text-muted">
            1 por competidor. Vale a média dos outros, arredondada para baixo.
          </span>
        </span>
        <input
          type="checkbox"
          name="offWeekEnabled"
          role="switch"
          checked={offWeekEnabled}
          onChange={(event) => setOffWeekEnabled(event.target.checked)}
          className="h-8 w-13 shrink-0 cursor-pointer appearance-none rounded-full bg-[#3a4250] transition-colors before:m-0.75 before:block before:size-6.5 before:rounded-full before:bg-white before:transition-transform checked:bg-accent checked:before:translate-x-5"
        />
      </label>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 flex w-full justify-between text-sm font-medium text-ink/85">
          Participantes
        </legend>
        <p className="-mt-1 text-[13px] text-muted">
          {members.length - excluded.size} de {members.length}
        </p>
        <ul className="rounded-2xl border border-line-soft bg-surface py-1">
          {members.map((member) => {
            const included = !excluded.has(member.id);
            return (
              <li
                key={member.id}
                className="flex min-h-14 items-center justify-between gap-2.5 border-b border-raised px-3.5 last:border-b-0"
              >
                <label className="flex min-h-11 grow cursor-pointer items-center gap-3 text-[15px] font-medium">
                  <input
                    type="checkbox"
                    name="participants"
                    value={member.id}
                    checked={included}
                    onChange={() => setExcluded(toggle(excluded, member.id))}
                    className="size-5.5 accent-accent"
                  />
                  <span className={included ? "" : "text-muted"}>{member.name}</span>
                </label>
                {included && offWeekEnabled && (
                  <label
                    className={`flex h-9 cursor-pointer items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap ${
                      offS1.has(member.id) ? "bg-off text-page" : "border border-[#3a4250] text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="offS1"
                      value={member.id}
                      checked={offS1.has(member.id)}
                      onChange={() => setOffS1(toggle(offS1, member.id))}
                      className="sr-only"
                    />
                    Off na S1
                  </label>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs leading-relaxed text-muted">
          Desmarque quem não vai participar. &quot;Off na S1&quot; deixa a pessoa de semana off já na
          primeira semana (conta como a semana off dela na temporada).
        </p>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-2xl bg-accent text-[17px] font-semibold text-page hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Criando…" : "Criar temporada"}
      </button>
    </form>
  );
}
