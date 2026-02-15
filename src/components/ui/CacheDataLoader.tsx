import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { db } from "../../db/database";
import { supabase } from "../../lib/supabase";
import { SplashScreen } from "./SplashScreen";
import { useAuth } from "../../context/AuthContext";
import { startOfWeek } from "date-fns";

export const CacheDataLoader = () => {
  const { user_id } = useAuth();
  const [isSyncComplete, setIsSyncComplete] = useState(false);

  useEffect(() => {
    const syncLibraryAndActivity = async () => {
      if (!user_id) return;

      try {
        const weekStart = startOfWeek(new Date(), {
          weekStartsOn: 1,
        }).toISOString();

        // Parallel Fetch for Library & Activity
        const [
          musclesRes,
          equipRes,
          exRes,
          exMusRes,
          exEquipRes,
          routinesRes,
          routExRes,
          levelsRes,
          workoutsRes,
        ] = await Promise.all([
          supabase.from("muscles").select("*"),
          supabase.from("equipment").select("*"),
          supabase.from("exercises").select("*"),
          supabase.from("exercise_muscles").select("*"),
          supabase.from("exercise_equipment").select("*"),
          supabase.from("routines").select("*"),
          supabase.from("routine_exercises").select("*"),
          supabase
            .from("athlete_levels_lookup")
            .select("*")
            .order("display_order"),
          supabase
            .from("workouts")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", weekStart),
        ]);

        // Atomic Transaction to update Dexie
        await db.transaction(
          "rw",
          [
            db.muscles,
            db.equipment,
            db.exercises,
            db.exercise_muscles,
            db.exercise_equipment,
            db.routines,
            db.routine_exercises,
            db.athlete_levels_lookup,
            db.workouts,
          ],
          async () => {
            if (musclesRes.data) await db.muscles.bulkPut(musclesRes.data);
            if (equipRes.data) await db.equipment.bulkPut(equipRes.data);
            if (exRes.data) await db.exercises.bulkPut(exRes.data);
            if (exMusRes.data) await db.exercise_muscles.bulkPut(exMusRes.data);
            if (exEquipRes.data)
              await db.exercise_equipment.bulkPut(exEquipRes.data);
            if (routinesRes.data) await db.routines.bulkPut(routinesRes.data);
            if (routExRes.data)
              await db.routine_exercises.bulkPut(routExRes.data);
            if (levelsRes.data)
              await db.athlete_levels_lookup.bulkPut(levelsRes.data);
            if (workoutsRes.data) await db.workouts.bulkPut(workoutsRes.data);
          },
        );

        setIsSyncComplete(true);
      } catch (error) {
        console.error("Sync Error:", error);
        // Fallback to allow app use even if sync fails (offline mode)
        setIsSyncComplete(true);
      }
    };

    syncLibraryAndActivity();
  }, [user_id]);

  return isSyncComplete ? <Outlet /> : <SplashScreen />;
};
