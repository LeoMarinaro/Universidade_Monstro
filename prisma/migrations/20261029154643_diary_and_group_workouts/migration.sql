-- Workout becomes the personal diary; GroupWorkout holds what counts in each
-- group's season; WorkoutRequest holds diary changes waiting for an admin.
-- Hand-edited: existing workouts are copied into GroupWorkout BEFORE the
-- Workout.source/markedById columns are dropped, so standings don't change.

-- CreateEnum
CREATE TYPE "RequestAction" AS ENUM ('ADD', 'REMOVE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "GroupWorkout" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "ActionSource" NOT NULL DEFAULT 'SELF',
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "action" "RequestAction" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "WorkoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupWorkout_groupId_date_idx" ON "GroupWorkout"("groupId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GroupWorkout_groupId_userId_date_key" ON "GroupWorkout"("groupId", "userId", "date");

-- CreateIndex
CREATE INDEX "WorkoutRequest_groupId_status_idx" ON "WorkoutRequest"("groupId", "status");

-- CreateIndex
CREATE INDEX "WorkoutRequest_userId_status_idx" ON "WorkoutRequest"("userId", "status");

-- AddForeignKey
ALTER TABLE "GroupWorkout" ADD CONSTRAINT "GroupWorkout_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupWorkout" ADD CONSTRAINT "GroupWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupWorkout" ADD CONSTRAINT "GroupWorkout_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutRequest" ADD CONSTRAINT "WorkoutRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutRequest" ADD CONSTRAINT "WorkoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutRequest" ADD CONSTRAINT "WorkoutRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copy existing workouts into every group whose season the person competes in
-- on that day (same rule the standings used until now)
INSERT INTO "GroupWorkout" ("id", "groupId", "userId", "date", "source", "markedById", "createdAt")
SELECT gen_random_uuid()::text, s."groupId", w."userId", w."date", w."source", w."markedById", w."createdAt"
FROM "Workout" w
JOIN "SeasonParticipant" p ON p."userId" = w."userId"
JOIN "Season" s ON s."id" = p."seasonId"
WHERE w."date" >= s."startDate"
  AND w."date" < s."startDate" + (s."weeks" * 7)
ON CONFLICT ("groupId", "userId", "date") DO NOTHING;

-- DropForeignKey
ALTER TABLE "Workout" DROP CONSTRAINT "Workout_markedById_fkey";

-- AlterTable
ALTER TABLE "Workout" DROP COLUMN "markedById",
DROP COLUMN "source";
