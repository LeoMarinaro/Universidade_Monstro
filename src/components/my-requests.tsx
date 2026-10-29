import { dateToKey, formatDayMonth } from "@/lib/dates";
import type { getMyRecentRequests } from "@/lib/workouts";

type Request = Awaited<ReturnType<typeof getMyRecentRequests>>[number];

const STATUS = {
  PENDING: { label: "Aguardando admin", className: "text-off" },
  APPROVED: { label: "Aceito", className: "text-accent" },
  REJECTED: { label: "Recusado", className: "text-danger" },
};

// Diary changes the person sent to group admins, under the grid
export function MyRequests({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[15px] font-semibold">Pedidos aos grupos</h2>
      <ul className="rounded-2xl border border-line-soft bg-surface py-1">
        {requests.map((request) => {
          const status = STATUS[request.status];
          return (
            <li
              key={request.id}
              className="flex items-center justify-between gap-3 border-b border-raised px-4 py-2.5 text-sm last:border-b-0"
            >
              <span>
                {request.action === "ADD" ? "Adicionar" : "Tirar"} {formatDayMonth(dateToKey(request.date))}
                <span className="text-muted"> · {request.group.name}</span>
              </span>
              <span className={`shrink-0 text-xs font-semibold ${status.className}`}>{status.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
