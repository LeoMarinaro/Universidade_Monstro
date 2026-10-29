"use client";

import { useActionState } from "react";
import { TextField } from "@/components/text-field";
import { deleteAccount, type DeleteAccountState } from "./actions";

const initialState: DeleteAccountState = { error: null };

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <TextField
        label="Para confirmar, digite APAGAR"
        name="confirm"
        autoComplete="off"
        placeholder="APAGAR"
        required
      />

      {state.error && (
        <p role="alert" className="text-sm leading-relaxed text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl border border-danger text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
      >
        {pending ? "Apagando…" : "Apagar minha conta"}
      </button>
    </form>
  );
}
