import { db } from "../db/database";
import type { AthleteLevel } from "../types/database.types";

export const AthleteLevelService = {
  /**
   * Saves the initial or updated level state to Dexie.
   */
  async saveLocalLevel(level: AthleteLevel) {
    return await db.athlete_level.put({
      ...level,
      is_synced: 0,
    });
  },
};
