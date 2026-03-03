import { useEffect, useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import { SplashScreen } from "./SplashScreen";
import { db } from "../../db/database";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { AnalyticsService } from "../../services/AnalyticsService";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { applySettingsToDOM } from "../../util/themeUtils";

export const CacheDataLoader = () => {
  const { user_id } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const syncStarted = useRef(false);

  useEffect(() => {
    if (!user_id || syncStarted.current) return;
    syncStarted.current = true;

    const hydrateData = async (): Promise<void> => {
      try {
        const now = new Date();
        const start = format(
          startOfWeek(now, { weekStartsOn: 1 }),
          "yyyy-MM-dd",
        );
        const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const todayStr = format(now, "yyyy-MM-dd");

        // STEP 1: Priority Hydration (Settings & Theme)
        // We load settings first so the UI doesn't "flash" the wrong color
        await ensureTableLoaded("app_settings", "app_settings", { user_id });
        const settings = await db.app_settings.get(user_id);

        // Apply the theme/brand attributes to the <html> tag immediately
        applySettingsToDOM(settings || null);

        // STEP 2: Parallel Hydration
        await Promise.all([
          AnalyticsService.getSmartCustomizedStats(user_id, start, end),
          AnalyticsService.getSmartCustomizedStats(user_id, todayStr, todayStr),

          fetchTable("v_user_dashboard", "athlete_summary"),
          fetchTable("user_profile", "user_profile"),
          fetchTable("v_latest_athlete_level", "athlete_level"),
          fetchTable("v_latest_body_metrics", "body_metrics"),
          fetchTable("v_latest_personal_records", "personal_records"),

          ensureTableLoaded("muscles", "muscles"),
          ensureTableLoaded("equipment", "equipment"),
          ensureTableLoaded("athlete_levels_lookup", "athlete_levels_lookup"),
          ensureTableLoaded("exercises", "exercises"),
          ensureTableLoaded("routines", "routines"),
          ensureTableLoaded("exercise_muscles", "exercise_muscles"),
          ensureTableLoaded("exercise_equipment", "exercise_equipment"),
          ensureTableLoaded("routine_exercises", "routine_exercises"),

          fetchTable("workouts", "workouts", { user_id }),
        ]);
      } catch (err) {
        console.error("❌ Cache DataLoader Failure:", err);
      } finally {
        setIsReady(true);
      }
    };

    hydrateData();
  }, [user_id]);

  if (!isReady) return <SplashScreen />;

  return <Outlet />;
};

/**
 * HELPER FUNCTIONS
 */

async function ensureTableLoaded(
  supabaseTable: string,
  dexieTable: string,
  filter?: object,
): Promise<void> {
  const localCount = await db.table(dexieTable).count();
  if (localCount > 0) return;
  return fetchTable(supabaseTable, dexieTable, filter);
}

async function fetchTable(
  supabaseTable: string,
  dexieTable: string,
  filter?: object,
): Promise<void> {
  let query = supabase.from(supabaseTable).select("*");
  if (filter) {
    Object.entries(filter).forEach(([key, val]) => {
      query = query.eq(key, val);
    });
  }
  const { data, error } = await query;
  if (error) throw error;
  if (data && data.length > 0) {
    const hydratedData = data.map((row) => ({ ...row, is_synced: 1 }));
    await db.table(dexieTable).bulkPut(hydratedData);
  }
}
