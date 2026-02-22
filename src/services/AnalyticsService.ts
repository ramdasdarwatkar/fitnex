import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type {
  LocalCustomizedStats,
  CustomizedStats,
} from "../types/database.types";

export const AnalyticsService = {
  /**
   * The "Engine" for range-based stats.
   * Checks Dexie first, then hits Supabase RPC.
   */
  async getSmartCustomizedStats(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<LocalCustomizedStats | null> {
    try {
      // 1. Local Cache Check
      const cached = await db.customized_stats
        .where("[user_id+start_date+end_date]")
        .equals([userId, startDate, endDate])
        .first();

      if (cached) return cached;

      // 2. Network Fetch via RPC
      // Passing the types directly into the .rpc generic if the client inference fails
      const { data, error } = await supabase.rpc("get_user_stats_between", {
        p_start: startDate,
        p_end: endDate,
      });

      if (error) throw error;

      // Supabase RPC returns an array of rows; we need the first one
      // We cast to our specific CustomizedStats type
      const row = (data as unknown as CustomizedStats[])?.[0];
      if (!row) return null;

      const localRow: LocalCustomizedStats = {
        ...row,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      };

      // 3. Update Cache
      await db.customized_stats.put(localRow);
      return localRow;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analytics sync failed";
      console.error("AnalyticsService Error:", msg);
      return null;
    }
  },

  /**
   * Forces a refresh of the local stats cache.
   */
  async invalidateStatsCache(): Promise<void> {
    try {
      await db.customized_stats.clear();
    } catch (err: unknown) {
      console.error("Failed to clear stats cache:", err);
    }
  },
};
