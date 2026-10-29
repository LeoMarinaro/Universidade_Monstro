import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/session";

// Temporary home page to test the login flow; the real one (workout grid,
// group cards) comes next
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-6 pt-5 pb-10">
      <header className="flex h-11 items-center justify-between">
        <span className="font-display text-xl font-bold tracking-tight">Universidade Monstro</span>
        <SignOutButton />
      </header>

      {/* Reads the session, so it streams in behind the boundary */}
      <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-surface" />}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await getCurrentUser();

  return (
    <section className="flex items-center gap-4">
      <div
        aria-hidden="true"
        className="flex size-18 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface font-display text-[28px] font-bold"
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-bold">Olá, {user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </div>
    </section>
  );
}
