"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/text-field";
import { phaseNames, QUALIFIER_OPTIONS } from "@/lib/formats/playoffs";
import type { CreateSeasonState } from "../../../season-actions";

type Props = {
  action: (previous: CreateSeasonState, formData: FormData) => Promise<CreateSeasonState>;
  nextNumber: number;
  defaultStart: string;
  members: { id: string; name: string }[];
};

const initialState: CreateSeasonState = { error: null };

const FORMATS = [
  { id: "RAW_POINTS", label: "Pontos brutos", description: "Cada treino vale 1 ponto", available: true },
  {
    id: "KNOCKOUT",
    label: "Play-offs",
    description: "Classificação e depois confrontos diretos, com a classificação geral junto",
    available: true,
  },
  { id: "STAGES", label: "Etapas", description: "Blocos de semanas; a colocação dá pontos", available: false },
];

const DEFAULT_QUALIFYING_WEEKS = "6";
const DEFAULT_PHASE_WEEKS = "3";

function durationValue(text: string) {
  const value = Number(text);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

export function SeasonForm({ action, nextNumber, defaultStart, members }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [format, setFormat] = useState("RAW_POINTS");
  const [offWeekEnabled, setOffWeekEnabled] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [offS1, setOffS1] = useState<Set<string>>(new Set());
  const [chosenQualifiers, setChosenQualifiers] = useState<number | null>(null);
  const [qualifyingWeeks, setQualifyingWeeks] = useState(DEFAULT_QUALIFYING_WEEKS);
  const [phaseDurations, setPhaseDurations] = useState<Record<string, string>>({});

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  // Only the phases that fit the participants; starts at the biggest one that fits
  const participantCount = members.length - excluded.size;
  const qualifierOptions = QUALIFIER_OPTIONS.filter((option) => option <= participantCount);
  const biggestOption = qualifierOptions.at(-1) ?? null;
  const qualifiers =
    chosenQualifiers !== null && qualifierOptions.includes(chosenQualifiers) ? chosenQualifiers : biggestOption;
  const phases = qualifiers ? phaseNames(qualifiers) : [];
  const phaseValue = (name: string) => phaseDurations[name] ?? DEFAULT_PHASE_WEEKS;
  const totalWeeks =
    durationValue(qualifyingWeeks) + phases.reduce((sum, name) => sum + durationValue(phaseValue(name)), 0);

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
        {format === "RAW_POINTS" && (
          <TextField label="Duração (semanas)" name="weeks" type="number" min={1} max={104} placeholder="24" required />
        )}
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-sm font-medium text-ink/85">Formato</legend>
        {FORMATS.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3.5 rounded-2xl border bg-surface px-4 py-3.5 ${
              format === option.id ? "border-accent" : "border-line-soft"
            } ${option.available ? "cursor-pointer" : "opacity-55"}`}
          >
            <input
              type="radio"
              name="format"
              value={option.id}
              checked={format === option.id}
              onChange={() => setFormat(option.id)}
              disabled={!option.available}
              className="size-5 shrink-0 accent-accent"
            />
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{option.label}</span>
              <span className="text-[13px] text-muted">{option.description}</span>
            </span>
            {!option.available && (
              <span className="rounded-full border border-[#3a4250] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-muted">
                Em breve
              </span>
            )}
          </label>
        ))}
      </fieldset>

      {format === "KNOCKOUT" && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-line-soft bg-surface p-4">
          <legend className="px-1 text-sm font-medium text-ink/85">Play-offs</legend>

          <div className="flex flex-col gap-2">
            <label htmlFor="qualifiers" className="text-sm font-medium text-ink/85">
              Fase inicial
            </label>
            {qualifiers ? (
              <select
                id="qualifiers"
                name="qualifiers"
                value={qualifiers}
                onChange={(event) => setChosenQualifiers(Number(event.target.value))}
                className="h-12 rounded-xl border border-line bg-page px-3 text-[15px] text-ink [color-scheme:dark]"
              >
                {qualifierOptions.map((option) => (
                  <option key={option} value={option}>
                    {phaseNames(option)[0]} ({option} classificados)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-danger">Os play-offs precisam de pelo menos 2 participantes.</p>
            )}
            <p className="text-xs leading-relaxed text-muted">
              As opções dependem do número de participantes ({participantCount}). Quem empatar na última
              vaga também passa e divide o confronto.
            </p>
          </div>

          <TextField
            label="Classificação (semanas)"
            name="qualifyingWeeks"
            type="number"
            min={1}
            value={qualifyingWeeks}
            onChange={(event) => setQualifyingWeeks(event.target.value)}
            required
          />

          {phases.map((name, index) => (
            <TextField
              key={name}
              id={`phase-weeks-${index}`}
              label={`${name} (semanas)`}
              name="phaseWeeks"
              type="number"
              min={1}
              value={phaseValue(name)}
              onChange={(event) => setPhaseDurations({ ...phaseDurations, [name]: event.target.value })}
              required
            />
          ))}

          <p className="border-t border-line-soft pt-3 text-sm">
            Duração total: <strong className="font-semibold">{totalWeeks} semanas</strong>
          </p>
        </fieldset>
      )}

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
          {participantCount} de {members.length}
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
