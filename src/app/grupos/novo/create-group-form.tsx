"use client";

import { useActionState } from "react";
import { TextField } from "@/components/text-field";
import { createGroup, type CreateGroupState } from "../actions";

const initialState: CreateGroupState = { error: null };

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4.5">
      <TextField
        label="Nome do grupo"
        name="name"
        placeholder="Monstros"
        minLength={2}
        maxLength={40}
        autoComplete="off"
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
        {pending ? "Criando…" : "Criar grupo"}
      </button>
    </form>
  );
}
