"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/next-path";

export function LoginForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (error) {
      setError(authErrorMessage(error.code));
      setPending(false);
      return;
    }

    // Stays "pending" until the next page loads
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        required
      />
      <TextField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-13 rounded-xl bg-accent text-base font-semibold text-page hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
