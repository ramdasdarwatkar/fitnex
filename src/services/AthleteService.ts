// services/AthleteService.ts

import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type {
  AthleteSummary,
  LocalCustomizedStats,
} from "../types/database.types";

export const AthleteService = {
  async syncSummary(uid: string): Promise<AthleteSummary | null> {
    const { data, error } = await supabase
      .from("v_user_dashboard")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      await db.athlete_summary.put(data);
      return data;
    }

    return null;
  },

  async syncCustomizedStats(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<LocalCustomizedStats | null> {
    // Cache first
    const cached = await db.customized_stats
      .where("[user_id+start_date+end_date]")
      .equals([userId, startDate, endDate])
      .first();

    if (cached) return cached;

    // Supabase RPC
    const { data, error } = await supabase.rpc("get_user_stats_between", {
      p_start: startDate,
      p_end: endDate,
    });

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    const localRow: LocalCustomizedStats = {
      ...row,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    };

    await db.customized_stats.put(localRow);

    return localRow;
  },

  /* READ helpers */

  async getSmartCustomizedStats(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    // 1. Try to find local data first
    const localData = await db.customized_stats
      .where("[user_id+start_date+end_date]")
      .equals([userId, startDate, endDate])
      .first();

    // 2. If data exists, return it immediately for the LiveQuery
    if (localData) return localData;

    // 3. If no data, perform the network sync
    console.log("No local stats found. Syncing from network...");
    await this.syncCustomizedStats(userId, startDate, endDate);

    // 4. Return the newly synced data (LiveQuery will also catch this automatically)
    return db.customized_stats
      .where("[user_id+start_date+end_date]")
      .equals([userId, startDate, endDate])
      .first();
  },
};
