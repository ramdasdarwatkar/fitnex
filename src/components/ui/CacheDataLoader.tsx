import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { db } from "../../db/database";
import { supabase } from "../../lib/supabase";
import { SplashScreen } from "./SplashScreen";
import { useAuth } from "../../context/AuthContext";

export const CacheDataLoader = () => {
  const { user_id, profile } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeAppData = async () => {
      if (!user_id || !profile) {
        setIsAppReady(true);
        return;
      }

      try {
        const [levelData, lookupCount, musclesCount] = await Promise.all([
          db.athlete_level.get(user_id),
          db.athlete_levels_lookup.count(),
          db.muscles.count(),
        ]);

        if (levelData && lookupCount > 0 && musclesCount > 0) {
          setIsAppReady(true);
          return;
        }

        const [levelRes, lookupRes, musclesRes] = await Promise.all([
          supabase
            .from("athlete_level")
            .select("*")
            .eq("user_id", user_id)
            .single(),
          supabase.from("athlete_levels_lookup").select("*"),
          supabase.from("muscles").select("*"),
        ]);

        if (levelRes.data) await db.athlete_level.put(levelRes.data);
        if (lookupRes.data)
          await db.athlete_levels_lookup.bulkPut(lookupRes.data);
        if (musclesRes.data) await db.muscles.bulkPut(musclesRes.data);

        setIsAppReady(true);
      } catch (error) {
        console.error("Hydration Sync Error:", error);
        setIsAppReady(true);
      }
    };

    initializeAppData();
  }, [user_id, profile]);

  return isAppReady ? <Outlet /> : <SplashScreen />;
};
