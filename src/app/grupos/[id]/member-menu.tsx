"use client";

import { useTransition } from "react";
import { makeAdmin, removeFromGroup, removeFromSeason } from "../member-actions";

type Props = {
  groupId: string;
  userId: string;
  name: string;
  isAdmin: boolean;
  inSeason: boolean; // competing in the running season
  canRemove: boolean; // false for the group's only admin
};

// "⋯" menu next to a member, shown to admins only
export function MemberMenu({ groupId, userId, name, isAdmin, inSeason, canRemove }: Props) {
  const [pending, startTransition] = useTransition();

  function run(message: string, action: () => Promise<void>) {
    if (window.confirm(message)) startTransition(action);
  }

  const itemClass =
    "flex min-h-11 w-full items-center px-3.5 text-left text-sm hover:bg-raised disabled:opacity-50";

  return (
    <details className="relative">
      <summary
        aria-label={`Ações para ${name}`}
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        {pending ? (
          "…"
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        )}
      </summary>
      <div className="absolute top-12 right-0 z-10 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg shadow-black/40">
        {!isAdmin && (
          <button
            type="button"
            disabled={pending}
            className={itemClass}
            onClick={() => run(`Tornar ${name} admin do grupo?`, () => makeAdmin(groupId, userId))}
          >
            Tornar admin
          </button>
        )}
        {inSeason && (
          <button
            type="button"
            disabled={pending}
            className={itemClass}
            onClick={() =>
              run(
                `Tirar ${name} da temporada? Os pontos até agora ficam congelados e ${name} continua no grupo.`,
                () => removeFromSeason(groupId, userId),
              )
            }
          >
            Tirar da temporada
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            disabled={pending}
            className={`${itemClass} text-danger`}
            onClick={() =>
              run(
                `Tirar ${name} do grupo? Sai também da temporada (os pontos até agora ficam congelados). ` +
                  "Para não voltar pelo link antigo, gere um novo link de convite.",
                () => removeFromGroup(groupId, userId),
              )
            }
          >
            Tirar do grupo
          </button>
        )}
        {isAdmin && !canRemove && (
          <p className="px-3.5 py-2.5 text-xs leading-relaxed text-muted">
            Único admin: torne outra pessoa admin antes de tirar.
          </p>
        )}
      </div>
    </details>
  );
}
