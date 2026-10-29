import type { Metadata } from "next";
import { Suspense } from "react";
import { BackHeader } from "@/components/back-header";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AvatarUploader } from "./avatar-uploader";
import { DeleteAccountForm } from "./delete-account-form";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Conta · Universidade Monstro" };

export default function AccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      <BackHeader href="/" label="Universidade Monstro" backLabel="Voltar para o início" />
      <h1 className="font-display text-[26px] font-bold">Conta</h1>

      {/* Reads the session, so it streams in behind the boundary */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <AccountContent />
      </Suspense>
    </main>
  );
}

async function AccountContent() {
  const user = await getCurrentUser();
  const { phone } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { phone: true } });

  return (
    <>
      <Section title="Perfil">
        <AvatarUploader name={user.name} image={user.image ?? null} />
        <ProfileForm name={user.name} phone={phone ?? ""} />
        <p className="text-xs leading-relaxed text-muted">
          E-mail: <span className="text-ink/85">{user.email}</span>. Trocar o e-mail vem depois.
        </p>
      </Section>

      <Section title="Trocar senha">
        <PasswordForm />
      </Section>

      <Section title="Sair">
        <p className="text-sm text-muted">Desconecta este aparelho.</p>
        <SignOutButton />
      </Section>

      <section className="mt-2 flex flex-col gap-3 rounded-2xl border border-danger/40 p-4">
        <h2 className="text-[15px] font-semibold text-danger">Apagar conta</h2>
        <p className="text-sm leading-relaxed text-muted">
          Seu nome, e-mail, celular e diário são apagados, e você sai de todos os grupos. Nas
          temporadas em andamento, seus pontos até agora ficam congelados como &quot;Conta
          deletada&quot;. Não dá para desfazer.
        </p>
        <DeleteAccountForm />
      </section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-line-soft bg-surface p-4">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
