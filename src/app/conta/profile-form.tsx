"use client";

import { useActionState } from "react";
import { TextField } from "@/components/text-field";
import { updateProfile, type ProfileState } from "./actions";

const initialState: ProfileState = { error: null, saved: false };

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField label="Nome" name="name" defaultValue={name} maxLength={40} autoComplete="name" required />
      <TextField
        label="Celular (opcional)"
        name="phone"
        type="tel"
        defaultValue={phone}
        placeholder="(11) 99999-0000"
        autoComplete="tel"
        hint="Vai servir para registrar treinos pelo WhatsApp no futuro."
      />

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm text-accent">
          Salvo!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-accent text-sm font-semibold text-page hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
