import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../db/database";
import { supabase } from "../../lib/supabase";
import { SplashScreen } from "./SplashScreen";

export const CacheDataLoader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user_id, profile } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeAppData = async () => {
      // If not logged in or onboarding is incomplete, AppRoutes handles it
      if (!user_id || !profile) {
        setIsAppReady(true);
        return;
      }

      try {
        // Check for specific user level AND the global lookup definitions
        const [levelData, lookupCount, musclesCount] = await Promise.all([
          db.athlete_level.get(user_id),
          db.athlete_levels_lookup.count(),
          db.muscles.count(),
        ]);

        // 🔥 FIX: If local definitions and user data exist, skip sync
        if (levelData && lookupCount > 0 && musclesCount > 0) {
          setIsAppReady(true);
          return;
        }

        // SLOW PATH: Sync everything required for the Dashboard
        const [levelRes, lookupRes, musclesRes] = await Promise.all([
          supabase
            .from("athlete_level")
            .select("*")
            .eq("user_id", user_id)
            .single(),
          supabase.from("athlete_levels_lookup").select("*"),
          supabase.from("muscles").select("*"),
        ]);

        // Atomic updates to Dexie
        if (levelRes.data) await db.athlete_level.put(levelRes.data);
        if (lookupRes.data)
          await db.athlete_levels_lookup.bulkPut(lookupRes.data);
        if (musclesRes.data) await db.muscles.bulkPut(musclesRes.data);

        setIsAppReady(true);
      } catch (error) {
        console.error("Hydration Sync Error:", error);
        // We set ready to true anyway to avoid trapping the user in a splash loop
        setIsAppReady(true);
      }
    };

    initializeAppData();
  }, [user_id, profile]);

  return isAppReady ? <>{children}</> : <SplashScreen />;
};
