import Link from "next/link";
import { Suspense } from "react";
import { GroupCards } from "@/components/group-cards";
import { MyRequests } from "@/components/my-requests";
import { SignOutButton } from "@/components/sign-out-button";
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
        <SignOutButton />
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
        <div
          aria-hidden="true"
          className="flex size-18 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-line-soft font-display text-[28px] font-bold"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
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
