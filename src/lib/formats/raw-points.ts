import type { FormatModule } from "./index";

// "Pontos brutos": each counted workout is one point
export const rawPoints: FormatModule = {
  calculate(participants) {
    return participants.map(({ userId, weekly }) => ({
      userId,
      points: weekly.reduce((sum, count) => sum + count, 0),
    }));
  },
};
