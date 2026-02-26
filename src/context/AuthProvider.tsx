import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { supabase } from "../lib/supabase";
import { SyncManager } from "../services/SyncManager";
import { AthleteService } from "../services/AthleteService";
import { AuthContext } from "./AuthTypes";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user_id, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * LIVE DATA OBSERVATION
   * Monitors Dexie for changes to the athlete summary.
   * Updates 'athlete' instantly when syncSummary or any DB write occurs.
   */
  const athlete = useLiveQuery(
    () => (user_id ? AthleteService.getLocalSummary(user_id) : null),
    [user_id],
  );

  /**
   * ATOMIC HYDRATION
   * Ensures User ID and Profile are resolved before the Splash Screen clears.
   */
  const hydrate = useCallback(async (uid: string) => {
    setUserId(uid);

    // Check if we have data locally
    const profile = await AthleteService.getLocalSummary(uid);

    // If missing and online, trigger the sync which writes to Dexie
    if (!profile && window.navigator.onLine) {
      await AthleteService.syncSummary(uid);
    }
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
    } catch (error) {
      console.error("Logout process failed:", error);
    }
  }, []);

  /**
   * Determine if we are still "Loading" the profile from Dexie
   * useLiveQuery returns 'undefined' while the initial promise resolves.
   */
  const isResolvingProfile = user_id !== null && athlete === undefined;

  const value = useMemo(
    () => ({
      user_id,
      athlete: athlete ?? null,
      loading: loading || isResolvingProfile,
      signOut,
    }),
    [user_id, athlete, loading, isResolvingProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
