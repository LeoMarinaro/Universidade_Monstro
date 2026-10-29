import type { Metadata } from "next";
import { BackHeader } from "@/components/back-header";
import { CreateGroupForm } from "./create-group-form";

export const metadata: Metadata = { title: "Criar grupo · Universidade Monstro" };

export default function NewGroupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      <BackHeader href="/" label="Universidade Monstro" backLabel="Voltar para o início" />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold">Criar grupo</h1>
        <p className="text-sm leading-relaxed text-muted">
          Você vira o admin do grupo. Depois é só mandar o link de convite para a galera.
        </p>
      </div>

      <CreateGroupForm />
    </main>
  );
}
