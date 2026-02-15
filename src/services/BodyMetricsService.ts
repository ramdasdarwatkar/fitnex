import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type BodyMetrics = Database["public"]["Tables"]["body_metrics"]["Row"];
type MetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];

export const BodyMetricsService = {
  // Fetch the most recent entry (RLS scoped to current user)
  async getLatestMetrics(): Promise<BodyMetrics | null> {
    try {
      const { data, error } = await supabase
        .from("v_latest_body_metrics")
        .select("*")
        .maybeSingle(); // safer than single()

      if (error) {
        console.error("Error fetching latest body metrics:", error.message);
        throw error;
      }

      return data ?? null;
    } catch (err) {
      console.error("Unexpected error in getLatestMetrics:", err);
      throw err;
    }
  },

  // Insert or update body metrics
  async updateMetrics(data: MetricsInsert) {
    try {
      const { error } = await supabase.from("body_metrics").upsert(data);

      if (error) {
        console.error("Error updating body metrics:", error.message);
        throw error;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error in updateMetrics:", err);
      throw err;
    }
  },
};
