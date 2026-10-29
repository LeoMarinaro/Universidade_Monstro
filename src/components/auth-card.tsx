import type { ReactNode } from "react";

// Shared frame of the login and sign-up pages: logo, title, form, footer link
export function AuthCard({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-between gap-10 px-6 pt-16 pb-10">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-accent">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0e1116"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.5 6.5v11" />
              <path d="M17.5 6.5v11" />
              <path d="M3.5 9v6" />
              <path d="M20.5 9v6" />
              <path d="M6.5 12h11" />
            </svg>
          </div>
          <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
            Universidade Monstro
          </h1>
          <p className="text-[15px] text-muted">Competição de treinos entre amigos</p>
        </header>
        {children}
      </div>
      <p className="text-center text-sm text-muted">{footer}</p>
    </main>
  );
}
