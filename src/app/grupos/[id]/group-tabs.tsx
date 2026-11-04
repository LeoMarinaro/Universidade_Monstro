"use client";

import { useState, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

// Segmented tabs; every panel is rendered on the server, this only switches
export function GroupTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Seções do grupo"
        className="flex gap-1 overflow-x-auto rounded-xl border border-line-soft bg-surface p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`h-10 flex-1 shrink-0 rounded-[9px] px-2.5 text-[13px] font-semibold whitespace-nowrap ${
              active === tab.id ? "bg-accent text-page" : "text-ink/85 hover:bg-raised"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
