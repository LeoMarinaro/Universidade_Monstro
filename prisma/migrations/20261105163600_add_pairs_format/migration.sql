-- AlterEnum
ALTER TYPE "SeasonFormat" ADD VALUE 'PAIRS';

-- AlterTable
ALTER TABLE "SeasonParticipant" ADD COLUMN     "teamNumber" INTEGER;

-- AlterTable
ALTER TABLE "SeasonResult" ADD COLUMN     "teamNumber" INTEGER,
ADD COLUMN     "teamPosition" INTEGER;
