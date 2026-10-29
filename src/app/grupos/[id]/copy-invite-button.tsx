"use client";

import { useState } from "react";

// Copies the full invite URL (this site's address + /convite/code)
export function CopyInviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(`${window.location.origin}/convite/${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#3a4250] text-sm font-medium text-ink/85 hover:border-muted"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
      <span aria-live="polite">{copied ? "Link copiado!" : "Copiar link de convite"}</span>
    </button>
  );
}
