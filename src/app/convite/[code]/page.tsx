import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getGroupByInviteCode } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { joinGroup } from "../../grupos/actions";

export const metadata: Metadata = { title: "Convite · Universidade Monstro" };

export default function InvitePage({ params }: PageProps<"/convite/[code]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <InviteContent params={params} />
      </Suspense>
    </main>
  );
}

async function InviteContent({ params }: Pick<PageProps<"/convite/[code]">, "params">) {
  const { code } = await params;
  const user = await getCurrentUser();
  const group = await getGroupByInviteCode(code);

  if (!group) {
    return (
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-2xl font-bold">Convite inválido</h1>
        <p className="text-sm leading-relaxed text-muted">
          Esse link não existe mais. Peça um link novo para o admin do grupo.
        </p>
        <Link href="/" className="mt-2 font-semibold text-accent hover:text-accent-hover">
          Ir para o início
        </Link>
      </section>
    );
  }

  // Already in the group: nothing to accept
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    select: { id: true },
  });
  if (membership) redirect(`/grupos/${group.id}`);

  return (
    <section className="flex flex-col items-center gap-6 rounded-2xl border border-line-soft bg-surface p-6 text-center">
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-2xl bg-line-soft font-display text-3xl font-bold text-accent"
      >
        {group.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted">Você foi convidado para o grupo</p>
        <h1 className="font-display text-[28px] font-bold">{group.name}</h1>
        <p className="text-sm text-muted">
          {group._count.members} {group._count.members === 1 ? "competidor" : "competidores"}
        </p>
      </div>
      <form action={joinGroup.bind(null, code)} className="w-full">
        <button
          type="submit"
          className="h-13 w-full rounded-xl bg-accent text-base font-semibold text-page hover:bg-accent-hover"
        >
          Entrar no grupo
        </button>
      </form>
    </section>
  );
}
