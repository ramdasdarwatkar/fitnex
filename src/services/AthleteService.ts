import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type { AthleteSummary } from "../types/database.types";

export const AthleteService = {
  /**
   * Syncs the high-level dashboard summary (BMI, Levels, etc.)
   */
  async syncSummary(uid: string): Promise<AthleteSummary | null> {
    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Summary sync failed";
      console.error("AthleteService Sync Error:", msg);
      throw new Error(msg);
    }
  },
};
