"use client";

import { useTransition } from "react";
import { leaveGroup } from "../member-actions";

type Props = {
  groupId: string;
  groupName: string;
  // "last" = only member left (leaving deletes the group);
  // "blocked" = only admin with other members; "normal" otherwise
  situation: "normal" | "last" | "blocked";
};

export function LeaveGroup({ groupId, groupName, situation }: Props) {
  const [pending, startTransition] = useTransition();

  if (situation === "blocked") {
    return (
      <p className="text-center text-[13px] leading-relaxed text-muted">
        Você é o único admin. Para sair do grupo, torne outra pessoa admin antes (aba Membros).
      </p>
    );
  }

  function handleClick() {
    const message =
      situation === "last"
        ? `Você é o último membro. Sair apaga o grupo ${groupName}, com as temporadas. Seus treinos continuam. Sair mesmo assim?`
        : `Sair do grupo ${groupName}? Se estiver na temporada, seus pontos até agora ficam congelados. Para voltar, você vai precisar de um novo convite.`;
    if (window.confirm(message)) startTransition(() => leaveGroup(groupId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="min-h-11 self-center px-3 text-sm font-medium text-danger underline-offset-4 hover:underline disabled:opacity-60"
    >
      {pending ? "Saindo…" : situation === "last" ? "Sair e apagar o grupo" : "Sair do grupo"}
    </button>
  );
}
