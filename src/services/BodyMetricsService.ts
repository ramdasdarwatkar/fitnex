import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type BodyMetrics = Database["public"]["Tables"]["body_metrics"]["Row"];
type MetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];

export const BodyMetricsService = {
  // Fetch the most recent entry from the view
  async getLatestMetrics(): Promise<BodyMetrics | null> {
    const { data, error } = await supabase
      .from("v_latest_body_metrics")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching metrics:", error.message);
      throw error;
    }
    return data;
  },

  // Insert or update body metrics
  async updateMetrics(data: MetricsInsert) {
    const { error } = await supabase.from("body_metrics").upsert({
      ...data,
      // Ensure logdate is set to today if not provided
      logdate: data.logdate || new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Error updating metrics:", error.message);
      throw error;
    }
    return true;
  },
};
