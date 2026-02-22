import { db } from "../db/database";
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

  async getMetricHistory(userId: string, columns: string[]) {
    const filter = columns.map((c) => `${c}.not.is.null`).join(",");

    const { data, error } = await supabase
      .from("body_metrics")
      .select(`logdate, ${columns.join(",")}`)
      .eq("user_id", userId)
      .or(filter)
      .order("logdate", { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Saves metrics to Dexie.
   * Uses 'put' to handle the composite key [user_id+logdate].
   */
  async saveLocalMetrics(metrics: BodyMetrics) {
    return await db.body_metrics.put({
      ...metrics,
      is_synced: 0,
    });
  },

  /**
   * Gets the latest logged metric for a user locally.
   */
  async getLatestLocal(user_id: string) {
    return await db.body_metrics
      .where("user_id")
      .equals(user_id)
      .reverse()
      .sortBy("logdate")
      .then((list) => list[0]);
  },
};
