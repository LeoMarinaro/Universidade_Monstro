"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

// Link between /entrar and /cadastro that keeps the ?next= destination
export function AuthSwitchLink({ href, children }: { href: string; children: ReactNode }) {
  const next = useSearchParams().get("next");
  const target = next ? `${href}?next=${encodeURIComponent(next)}` : href;

  return (
    <Link href={target} className="font-semibold text-accent hover:text-accent-hover">
      {children}
    </Link>
  );
}
