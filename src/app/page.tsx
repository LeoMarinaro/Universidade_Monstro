import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { GroupCards } from "@/components/group-cards";
import { MyRequests } from "@/components/my-requests";
import { WorkoutGrid } from "@/components/workout-grid";
import { getUserGroups } from "@/lib/groups";
import { getCurrentUser } from "@/lib/session";
import { getMyRecentRequests, getRecentWorkoutDays } from "@/lib/workouts";
import { TrainedTodayButton } from "./trained-today-button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-5 pb-10">
      <header className="flex h-11 items-center justify-between">
        <span className="font-display text-xl font-bold tracking-tight">Universidade Monstro</span>
        <Link
          href="/conta"
          aria-label="Conta"
          className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink/85 hover:border-muted"
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </header>

      {/* Everything below reads the session, so it streams in behind the boundary */}
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  const [{ today, days }, groups, requests] = await Promise.all([
    getRecentWorkoutDays(user.id),
    getUserGroups(user.id),
    getMyRecentRequests(user.id),
  ]);

  return (
    <>
      <section className="flex items-center gap-4">
        <Avatar
          name={user.name}
          image={user.image}
          className="size-18 border-2 border-accent font-display text-[28px] font-bold"
        />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-bold">{user.name}</h1>
          <p className="text-sm text-muted">
            {groups.length} {groups.length === 1 ? "grupo" : "grupos"} ·{" "}
            <Link href={`/perfil/${user.id}`} className="font-semibold text-accent hover:text-accent-hover">
              Ver meu perfil
            </Link>
          </p>
        </div>
      </section>

      <TrainedTodayButton trainedToday={days.includes(today)} />
      <WorkoutGrid today={today} days={days} />
      <MyRequests requests={requests} />
      <GroupCards groups={groups} today={today} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="h-18 animate-pulse rounded-2xl bg-surface" />
      <div className="h-14 animate-pulse rounded-2xl bg-surface" />
      <div className="h-96 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
