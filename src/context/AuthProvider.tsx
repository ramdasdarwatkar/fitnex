import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import { SyncManager } from "../services/SyncManager";
import { AuthContext } from "./AuthTypes";
import type { AthleteSummary } from "../types/database.types";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user_id, setUserId] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Session + State Sync
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const id = session?.user?.id || null;
      setUserId(id);

      if (id) {
        const localAthlete = await db.athlete_summary.get(id);
        if (localAthlete) setAthlete(localAthlete);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      if (!session) setAthlete(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Safe Sign Out Logic
  const signOut = useCallback(async () => {
    try {
      // 1. Attempt final sync if online
      if (window.navigator.onLine) {
        await SyncManager.reconcile();
      }

      // 2. Safety Check for Unsynced Data
      const writableTables = [
        "body_metrics",
        "workouts",
        "workout_logs",
        "exercises",
        "routines",
        "exercise_muscles",
        "exercise_equipment",
        "routine_exercises",
      ];
      const counts = await Promise.all(
        writableTables.map((t) =>
          db.table(t).where("is_synced").equals(0).count(),
        ),
      );

      const totalPending = counts.reduce((a, b) => a + b, 0);
      if (
        totalPending > 0 &&
        !window.confirm(
          `Warning: ${totalPending} items are unsynced. Logout anyway?`,
        )
      ) {
        return;
      }

      // 3. Clear Local Storage & Sign Out
      await Promise.all(db.tables.map((table) => table.clear()));
      await supabase.auth.signOut();

      setUserId(null);
      setAthlete(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user_id,
      athlete,
      loading,
      signOut,
    }),
    [user_id, athlete, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
