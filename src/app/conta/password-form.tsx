"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

// Better Auth's default minimum; the server checks it too
const MIN_PASSWORD_LENGTH = 8;

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError(null);
    setSaved(false);

    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword")),
      newPassword: String(form.get("newPassword")),
      // Other phones and computers have to log in again with the new password
      revokeOtherSessions: true,
    });

    setPending(false);
    if (error) {
      setError(authErrorMessage(error.code));
      return;
    }
    formElement.reset();
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Senha atual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <TextField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres. Os outros aparelhos vão precisar entrar de novo.`}
        required
      />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-accent">
          Senha trocada!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl border border-accent text-sm font-semibold text-accent hover:bg-raised disabled:opacity-60"
      >
        {pending ? "Trocando…" : "Trocar senha"}
      </button>
    </form>
  );
}
