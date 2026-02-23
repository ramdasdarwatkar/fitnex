import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { SyncManager } from "../services/SyncManager";
import { AthleteService } from "../services/AthleteService";
import { AuthContext } from "./AuthTypes";
import type { AthleteSummary } from "../types/database.types";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user_id, setUserId] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteSummary | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * ATOMIC HYDRATION
   * Ensures User ID and Profile are resolved before the Splash Screen clears.
   */
  const hydrate = useCallback(async (uid: string) => {
    // 1. Service handles the Dexie vs Supabase priority logic
    let profile = await AthleteService.getLocalSummary(uid);

    if (!profile && window.navigator.onLine) {
      profile = await AthleteService.syncSummary(uid);
    }

    // 2. We set both states. React batches these updates into one render cycle.
    setUserId(uid);
    setAthlete(profile);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const id = session?.user?.id || null;

        if (id) {
          await hydrate(id);
        } else {
          setUserId(null);
          setAthlete(null);
        }
      } catch (err) {
        console.error("Auth Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const id = session?.user?.id || null;

      if (!session) {
        setUserId(null);
        setAthlete(null);
        setLoading(false);
      } else {
        await hydrate(id!);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrate]);

  /**
   * SAFE SIGN OUT
   * Prevents data loss by checking SyncManager before purging local DB.
   */
  const signOut = useCallback(async () => {
    try {
      if (!window.navigator.onLine) {
        alert(
          "Authentication Error: You must be online to sync and logout safely.",
        );
        return;
      }

      // 1. Attempt a final sync push
      await SyncManager.reconcile();

      // 2. Check for "Dirty" (Unsynced) rows
      const status = await SyncManager.getSyncStatus();

      if (!status.isClean) {
        const force = window.confirm(
          `Sync Warning: ${status.total} items failed to reach the cloud. Logout and lose changes?\n\nDetails: ${status.details.join(", ")}`,
        );
        if (!force) return;
      }

      // 3. Clear data via Manager and sign out from Supabase
      await SyncManager.clearLocalDatabase();
      await supabase.auth.signOut();

      setUserId(null);
      setAthlete(null);
    } catch (error) {
      console.error("Logout process failed:", error);
    }
  }, []);

  const value = useMemo(
    () => ({ user_id, athlete, loading, signOut }),
    [user_id, athlete, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
