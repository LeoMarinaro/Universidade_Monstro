import type { SeasonFormat } from "@/generated/prisma/client";
import { rawPoints } from "./raw-points";

// What every season format module receives: each participant's counted
// workouts per week (S1 first), with off weeks already replaced by the average
export type ParticipantWeeks = { userId: string; weekly: number[] };

export type FormatModule = {
  calculate(participants: ParticipantWeeks[], config: unknown): { userId: string; points: number }[];
};

// One module per format. A new format = a new file here + an entry below.
export const FORMAT_MODULES: Partial<Record<SeasonFormat, FormatModule>> = {
  RAW_POINTS: rawPoints,
};
