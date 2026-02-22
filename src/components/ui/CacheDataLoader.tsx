import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { SplashScreen } from "./SplashScreen";
import { db } from "../../db/database";
import { supabase } from "../../lib/supabase";
import { SyncManager } from "../../services/SyncManager";
import { useAuth } from "../../hooks/useAuth";

export const CacheDataLoader = () => {
  const { user_id } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const syncStarted = useRef(false);

  /**
   * PULL ENGINE: Fetching and Hydrating Dexie
   * Maps exactly to your database structure requirements.
   */
  useEffect(() => {
    if (!user_id || syncStarted.current) return;
    syncStarted.current = true;

    const hydrateData = async () => {
      try {
        await Promise.all([
          // 1. READ-ONLY STATICS (Fetched once)
          fetchTable("muscles", "muscles"),
          fetchTable("equipment", "equipment"),
          fetchTable("athlete_levels_lookup", "athlete_levels_lookup"),

          // 2. SNAPSHOTS (Latest Views - one row per user or latest per exercise)
          fetchTable("v_user_dashboard", "athlete_summary"),
          fetchTable("v_latest_body_metrics", "body_metrics"),
          fetchTable("v_latest_personal_records", "personal_records"),

          // 3. WRITABLE USER CONTENT (Pulling existing cloud data to local)
          fetchTable("exercises", "exercises", { user_id }),
          fetchTable("routines", "routines", { user_id }),
          fetchTable("workouts", "workouts", { user_id }),

          // 4. MAPPINGS & LOGS (Relational Data)
          fetchTable("exercise_muscles", "exercise_muscles"),
          fetchTable("exercise_equipment", "exercise_equipment"),
          fetchTable("routine_exercises", "routine_exercises"),
          fetchTable("workout_logs", "workout_logs"),
        ]);
      } catch (err) {
        console.error("❌ Hydration Failed:", err);
      } finally {
        // Subtle timeout to let SplashScreen finish its fade-in/out cycle
        setTimeout(() => setIsReady(true), 300);
      }
    };

    hydrateData();
  }, [user_id]);

  /**
   * PURGE SAFETY ENGINE (The "Wipe" Logic)
   * Strictly checks all writable tables for is_synced: 0 before allowing a clear.
   */
  const safePurgeCache = useCallback(async () => {
    try {
      // 1. Attempt a final reconciliation push
      await SyncManager.reconcile();

      // 2. List all tables where user can write data
      const writableTables = [
        "body_metrics",
        "exercises",
        "exercise_muscles",
        "exercise_equipment",
        "routines",
        "routine_exercises",
        "workouts",
        "workout_logs",
        "muscles",
      ];

      // 3. Check for any 'is_synced' === 0 (Number type as per your types)
      const pendingResults = await Promise.all(
        writableTables.map(async (table) => {
          const count = await db
            .table(table)
            .where("is_synced")
            .equals(0)
            .count();
          return { table, count };
        }),
      );

      const totalPending = pendingResults.reduce(
        (acc, curr) => acc + curr.count,
        0,
      );

      if (totalPending > 0) {
        const tableList = pendingResults
          .filter((r) => r.count > 0)
          .map((r) => r.table)
          .join(", ");
        throw new Error(
          `CRITICAL: Cannot clear cache. ${totalPending} items unsynced in: [${tableList}].`,
        );
      }

      // 4. If perfectly clean, wipe all tables
      await Promise.all(db.tables.map((table) => table.clear()));
      console.log("🧹 Cache wiped safely.");
      window.location.reload();
    } catch (err: any) {
      console.error("Safety Stop:", err.message);
      // In production, trigger your ConfirmModal or a Toast here
      alert(err.message);
    }
  }, []);

  if (!isReady) return <SplashScreen />;

  return <Outlet context={{ safePurgeCache }} />;
};

/**
 * UTILITY: fetchTable
 * Syncs Supabase data to Dexie and marks it as already synced (is_synced: 1).
 */
async function fetchTable(
  supabaseTable: string,
  dexieTable: string,
  filter?: object,
) {
  let query = supabase.from(supabaseTable).select("*");

  if (filter) {
    Object.entries(filter).forEach(([key, val]) => {
      query = query.eq(key, val);
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  if (data && data.length > 0) {
    // We add the is_synced: 1 flag so the SyncManager doesn't try to push back
    // data we just pulled from the cloud.
    const hydratedData = data.map((row) => ({ ...row, is_synced: 1 }));
    await db.table(dexieTable).bulkPut(hydratedData);
  }
}
