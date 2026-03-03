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
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * LIVE DATA OBSERVATION
   * Monitors Dexie for changes. By moving setUserId to the END of hydration,
   * this query will resolve almost instantly when the app "unlocks".
   */
  const athlete = useLiveQuery(
    () => (user_id ? AthleteService.getLocalSummary(user_id) : null),
    [user_id],
  );

  /**
   * ATOMIC HYDRATION
   * We wait for the database/sync to finish BEFORE setting user_id.
   * This prevents the Router from jumping to /dashboard before data exists.
   */
  const hydrate = useCallback(async (uid: string) => {
    // 1. Fetch/Sync profile silently while Splash is still up
    const profile = await AthleteService.getLocalSummary(uid);

    if (!profile && window.navigator.onLine) {
      await AthleteService.syncSummary(uid);
    }

    // 2. ONLY NOW trigger the Router by setting user_id
    setUserId(uid);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const id = session?.user?.id || null;

        if (id) {
          await hydrate(id);
        }
      } catch (err) {
        console.error("Auth Initialization Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const id = session?.user?.id || null;

      if (event === "SIGNED_IN" && id) {
        setIsInitializing(true); // Raise barrier
        await hydrate(id);
        setIsInitializing(false); // Drop barrier
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrate]);

  /**
   * SAFE SIGN OUT
   * 1. Raise the Splash Shield immediately.
   * 2. Sync final data to cloud.
   * 3. Purge local Dexie (athlete becomes null).
   * 4. Kill Supabase session.
   * 5. Reset UID (Router moves to /login).
   */
  const signOut = useCallback(async () => {
    try {
      // Must be online to reconcile Dexie with Supabase
      if (!window.navigator.onLine) {
        alert("Authentication Error: You must be online to logout safely.");
        return;
      }

      // Raise the barrier IMMEDIATELY
      setIsInitializing(true);

      // 1. Sync any remaining local changes
      await SyncManager.reconcile();

      // 2. Clear local database (This makes athlete = null)
      await SyncManager.clearLocalDatabase();

      // 3. Terminate Supabase Session
      await supabase.auth.signOut();

      // 4. Reset User ID (This triggers the Router redirect to /login)
      setUserId(null);
    } catch (error) {
      console.error("Logout process failed:", error);
    } finally {
      // We only drop the barrier once the UID is null and router has moved
      setIsInitializing(false);
    }
  }, []);

  /**
   * THE FINAL VALUE
   * 'loading' is true if:
   * - We are still checking Supabase/Hydrating (isInitializing)
   * - OR we have a ID but Dexie is still 'undefined' (isResolving)
   */
  const isResolving = user_id !== null && athlete === undefined;

  const value = useMemo(
    () => ({
      user_id,
      athlete: athlete ?? null,
      loading: isInitializing || isResolving,
      signOut,
    }),
    [user_id, athlete, isInitializing, isResolving, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
