import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type { AthleteSummary } from "../types/database.types";

export const AthleteService = {
  /**
   * Fetches the unified view from Supabase and updates the local FitnexDB cache.
   * This is the single source of truth for the athlete's aggregated state.
   */
  async syncSummary(uid: string): Promise<AthleteSummary | null> {
    const { data, error } = await supabase
      .from("v_user_dashboard")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Atomic update to local cache
      await db.athlete_summary.put(data as AthleteSummary);
      return data as AthleteSummary;
    }

    return null;
  },
};
