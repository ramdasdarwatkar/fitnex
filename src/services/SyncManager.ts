import { db } from "../db/database";
import { supabase } from "../lib/supabase";

export const SyncManager = {
  /**
   * RECONCILE ALL
   * The master push engine. Processes tables in order of relational priority.
   */
  async reconcile(): Promise<void> {
    if (!window.navigator.onLine) return;

    try {
      // 1. Core Entities (Parents)
      await this.pushTable("body_metrics", "user_id, logdate");
      await this.pushTable("muscles", "id");
      await this.pushTable("exercises", "id");
      await this.pushTable("routines", "id");
      await this.pushTable("workouts", "id");

      // 2. Relational Mappings & Logs (Children/Dependencies)
      // These run in parallel to speed up the sync process
      await Promise.all([
        this.pushTable("exercise_muscles", "exercise_id, muscle_id"),
        this.pushTable("exercise_equipment", "exercise_id, equipment_id"),
        this.pushTable("routine_exercises", "routine_id, exercise_id"),
        this.pushTable("workout_logs", "id"),
      ]);

      console.log("☁️ Global Sync: All local changes pushed to cloud.");
    } catch (err: unknown) {
      console.error(
        "❌ Sync Engine Error:",
        err instanceof Error ? err.message : err,
      );
    }
  },

  /**
   * GENERIC PUSH METHOD
   * Strips 'is_synced' and bulk upserts to Supabase based on your database.types.
   * Handles both single primary keys and composite keys.
   */
  async pushTable(tableName: string, conflictKeys: string) {
    // 1. Identify "dirty" rows (is_synced: 0)
    const dirty = await db
      .table(tableName)
      .where("is_synced")
      .equals(0)
      .toArray();
    if (dirty.length === 0) return;

    // 2. Prepare Payload
    // This destructures the object to remove 'is_synced' before it hits Supabase
    const payload = dirty.map(({ is_synced, ...originalData }) => originalData);

    // 3. Supabase Upsert
    // onConflict is critical to prevent duplicate rows for composite keys
    const { error } = await supabase
      .from(supabaseMapping[tableName] || tableName)
      .upsert(payload, { onConflict: conflictKeys });

    if (error) throw error;

    // 4. Update Local Status
    // We parse the conflictKeys to handle composite index lookups in Dexie
    const primaryKeys = conflictKeys.split(",").map((k) => k.trim());

    if (primaryKeys.length === 1) {
      // Single ID Logic (e.g., 'id')
      const pk = primaryKeys[0];
      const ids = dirty.map((d) => d[pk]);
      await db.table(tableName).where(pk).anyOf(ids).modify({ is_synced: 1 });
    } else {
      // Composite Key Logic (e.g., 'user_id, logdate')
      // Dexie requires the bracket syntax [key1+key2] for composite indices
      const compositeIndex = `[${primaryKeys.join("+")}]`;
      const compositeValues = dirty.map((d) => primaryKeys.map((pk) => d[pk]));
      await db
        .table(tableName)
        .where(compositeIndex)
        .anyOf(compositeValues)
        .modify({ is_synced: 1 });
    }
  },
};

/**
 * Mapping local Dexie table names to Supabase table names
 * (if they differ, otherwise defaults to the same name)
 */
const supabaseMapping: Record<string, string> = {
  exercise_muscles: "exercise_muscles",
  exercise_equipment: "exercise_equipment",
  routine_exercises: "routine_exercises",
};
