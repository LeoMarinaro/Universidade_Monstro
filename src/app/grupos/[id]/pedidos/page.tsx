import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { dateToKey, formatDayMonth, keyToDate } from "@/lib/dates";
import { getGroupForUser } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { decideRequest } from "../../request-actions";

export const metadata: Metadata = { title: "Pedidos de treino · Universidade Monstro" };

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function RequestsPage({ params }: PageProps<"/grupos/[id]/pedidos">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      {/* Reads the URL and the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <RequestsContent params={params} />
      </Suspense>
    </main>
  );
}

async function RequestsContent({ params }: Pick<PageProps<"/grupos/[id]/pedidos">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const group = await getGroupForUser(id, user);
  if (!group || !group.isAdmin) notFound();

  const requests = await prisma.workoutRequest.findMany({
    where: { groupId: group.id, status: "PENDING" },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { id: true, date: true, action: true, user: { select: { name: true } } },
  });

  return (
    <>
      <BackHeader href={`/grupos/${group.id}`} label={`${group.name} · Admin`} backLabel="Voltar para o grupo" />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Pedidos de treino</h1>
        <p className="text-sm leading-relaxed text-muted">
          Alguém mudou um dia passado no próprio diário. Aceitar faz a tabela do grupo seguir o
          diário; recusar deixa a tabela como está.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-2xl border border-line-soft bg-surface p-4 text-sm text-muted">
          Nenhum pedido esperando.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {requests.map((request) => {
            const day = dateToKey(request.date);
            const add = request.action === "ADD";
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-surface p-4"
              >
                <p className="text-[15px] leading-snug">
                  <strong className="font-semibold">{request.user.name}</strong>{" "}
                  <span className={add ? "text-accent" : "text-danger"}>
                    {add ? "quer adicionar" : "quer tirar"}
                  </span>{" "}
                  o treino de{" "}
                  <strong className="font-semibold">
                    {WEEKDAYS[keyToDate(day).getUTCDay()]}, {formatDayMonth(day)}
                  </strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <form action={decideRequest.bind(null, request.id, false)}>
                    <button
                      type="submit"
                      className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink/85 hover:border-muted"
                    >
                      Recusar
                    </button>
                  </form>
                  <form action={decideRequest.bind(null, request.id, true)}>
                    <button
                      type="submit"
                      className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-page hover:bg-accent-hover"
                    >
                      Aceitar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
