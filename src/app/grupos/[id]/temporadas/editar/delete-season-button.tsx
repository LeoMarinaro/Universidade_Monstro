"use client";

import { useTransition } from "react";

export function DeleteSeasonButton({ action, seasonLabel }: { action: () => Promise<void>; seasonLabel: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (window.confirm(`Apagar a ${seasonLabel}? Não dá para desfazer.`)) startTransition(action);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="h-12 rounded-xl border border-danger text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
    >
      {pending ? "Apagando…" : `Apagar ${seasonLabel}`}
    </button>
  );
}
