import { db } from "../db/database";
import { supabase } from "../lib/supabase";

export const SyncManager = {
  /**
   * 1. SYNC STATUS CHECK
   * Verified against your hydration list.
   */
  async getSyncStatus(): Promise<{
    isClean: boolean;
    total: number;
    details: string[];
  }> {
    const writableTables = [
      "user_profile",
      "body_metrics",
      "athlete_level",
      "muscles",
      "exercises",
      "routines",
      "workouts",
      "exercise_muscles",
      "exercise_equipment",
      "routine_exercises",
      "workout_logs",
      "app_settings",
      "personal_records",
    ];

    const results = await Promise.all(
      writableTables.map(async (t) => {
        const count = await db.table(t).where("is_synced").equals(0).count();
        return { table: t, count };
      }),
    );

    const dirtyTables = results.filter((r) => r.count > 0);
    return {
      isClean: dirtyTables.length === 0,
      total: dirtyTables.reduce((acc, curr) => acc + curr.count, 0),
      details: dirtyTables.map((r) => `${r.table}: ${r.count}`),
    };
  },

  /**
   * 2. ATOMIC LOCAL PURGE
   */
  async clearLocalDatabase(): Promise<void> {
    await Promise.all(db.tables.map((table) => table.clear()));
  },

  /**
   * 3. RECONCILE
   * Orchestrates the push in relational order.
   */
  async reconcile(): Promise<void> {
    if (!window.navigator.onLine) return;
    try {
      // Step 1: Push Independent Entities (Parents)
      await this.pushTable("user_profile", "user_id");
      await this.pushTable("athlete_level", "user_id");
      await this.pushTable("body_metrics", "user_id, logdate");
      await this.pushTable("app_settings", "user_id");
      await this.pushTable(
        "personal_records",
        "user_id, exercise_id, value_type, record_date",
      );
      await this.pushTable("muscles", "id");
      await this.pushTable("exercises", "id");
      await this.pushTable("routines", "id");
      await this.pushTable("workouts", "id");

      // Step 2: Push Relational Mappings (Children)
      await Promise.all([
        this.pushTable("exercise_muscles", "exercise_id, muscle_id"),
        this.pushTable("exercise_equipment", "exercise_id, equipment_id"),
        this.pushTable("routine_exercises", "routine_id, exercise_id"),
        this.pushTable("workout_logs", "id"),
      ]);
    } catch (err) {
      console.error("Sync Engine Error:", err);
      throw err;
    }
  },

  /**
   * 4. GENERIC PUSH ENGINE
   * Strips local-only columns before upserting to Supabase.
   */
  async pushTable(tableName: string, conflictKeys: string) {
    const table = db.table(tableName);
    const dirty = await table.where("is_synced").equals(0).toArray();

    if (dirty.length === 0) return;

    // DATA CLEANING LOGIC
    const payload = dirty.map((item) => {
      // 1. Remove 'is_synced' from every table
      // 2. Remove 'completed' specifically from 'workout_logs'
      const { is_synced, ...rest } = item;

      if (tableName === "workout_logs") {
        const { completed, ...supabaseData } = rest;
        return supabaseData;
      }

      return rest;
    });

    // UPSERT directly to the table name
    const { error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: conflictKeys });

    if (error) throw error;

    // Local Update Logic: Mark as synced
    const primaryKeys = conflictKeys.split(",").map((k) => k.trim());

    if (primaryKeys.length === 1) {
      const pk = primaryKeys[0];
      await table
        .where(pk)
        .anyOf(dirty.map((d) => d[pk]))
        .modify({ is_synced: 1 });
    } else {
      const compositeIndex = `[${primaryKeys.join("+")}]`;
      const compositeValues = dirty.map((d) => primaryKeys.map((pk) => d[pk]));
      await table
        .where(compositeIndex)
        .anyOf(compositeValues)
        .modify({ is_synced: 1 });
    }
  },

  /**
   * Refresh data selectively based on unsynced rows.
   * - user_profile / body_metrics → also triggers AthleteService.syncSummary()
   * - other tables → just sync if unsynced
   */
  async refresh(): Promise<void> {
    if (!window.navigator.onLine) return;

    // List of tables to check for refresh
    const tablesToCheck = [
      "user_profile",
      "body_metrics",
      "muscles",
      "exercises",
      "routines",
      "exercise_muscles",
      "exercise_equipment",
      "routine_exercises",
      "workouts",
      "workout_logs",
      "app_settings",
      "personal_records",
    ];

    try {
      const dirtyStatus = await Promise.all(
        tablesToCheck.map(async (t) => {
          const count = await db.table(t).where("is_synced").equals(0).count();
          return { table: t, count };
        }),
      );

      for (const { table, count } of dirtyStatus) {
        if (count === 0) continue; // skip clean tables

        switch (table) {
          case "user_profile":
            await this.pushTable("user_profile", "user_id");
            await AthleteService.syncSummary(); // refresh summary
            break;

          case "body_metrics":
            await this.pushTable("body_metrics", "user_id, logdate");
            await AthleteService.syncSummary(); // refresh summary
            break;

          case "muscles":
          case "exercises":
          case "routines":
          case "exercise_muscles":
          case "exercise_equipment":
          case "routine_exercises":
            await this.pushTable(table, "id");
            break;

          case "workouts":
            await this.pushTable("workouts", "id");
            break;

          case "workout_logs":
            await this.pushTable("workout_logs", "id");
            break;

          case "app_settings":
            await this.pushTable("app_settings", "user_id");
            break;

          case "personal_records":
            await this.pushTable("personal_records", "id");
            break;

          default:
            break;
        }
      }
    } catch (err) {
      console.error("❌ SyncManager.refresh() failed:", err);
      throw err;
    }
  },
};
