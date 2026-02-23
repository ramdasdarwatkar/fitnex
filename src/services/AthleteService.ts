import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type { AthleteSummary } from "../types/database.types";

export const AthleteService = {
  /**
   * Get summary from Local Dexie
   */
  async getLocalSummary(uid: string): Promise<AthleteSummary | null> {
    return (await db.athlete_summary.get(uid)) || null;
  },

  /**
   * Syncs from Supabase and caches locally
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
    } catch (err) {
      console.error("AthleteService Sync Error:", err);
      return null;
    }
  },
};
