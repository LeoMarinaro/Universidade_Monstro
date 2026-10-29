import Link from "next/link";

// Top bar of inner pages: back button + where you are
export function BackHeader({ href, label, backLabel }: { href: string; label: string; backLabel: string }) {
  return (
    <header className="flex h-11 items-center gap-3">
      <Link
        href={href}
        aria-label={backLabel}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink/85 hover:border-muted"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
      <span className="text-sm text-muted">{label}</span>
    </header>
  );
}
