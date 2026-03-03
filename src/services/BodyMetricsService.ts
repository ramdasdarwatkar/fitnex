import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type BodyMetrics = Database["public"]["Tables"]["body_metrics"]["Row"];
type MetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];

export const BodyMetricsService = {
  // Fetch the most recent entry from the view
  async getLocalMetrics(): Promise<BodyMetrics | null> {
    return (await db.body_metrics.orderBy("logdate").reverse().first()) || null;
  },

  // Insert or update body metrics
  async updateMetrics(data: MetricsInsert) {
    return await db.body_metrics.put({
      ...data,
      is_synced: 0,
    });
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

  async saveLocalMetrics(metrics: BodyMetrics) {
    return await db.body_metrics.put({
      ...metrics,
      is_synced: 0,
    });
  },
};
