"use client";

import { useTransition } from "react";
import { regenerateInviteCode } from "../member-actions";

export function RegenerateInviteButton({ groupId }: { groupId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (window.confirm("Gerar um novo link de convite? O link antigo para de funcionar.")) {
      startTransition(() => regenerateInviteCode(groupId));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="min-h-11 self-center px-3 text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
    >
      {pending ? "Gerando…" : "Gerar novo link de convite"}
    </button>
  );
}
