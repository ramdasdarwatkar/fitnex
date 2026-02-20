import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SplashScreen } from "./SplashScreen";
import { useAuth } from "../../context/AuthContext";

import { LibraryService } from "../../services/LibraryService";
import { WorkoutService } from "../../services/WorkoutService";
import { RoutineService } from "../../services/RoutineService";
import { AthleteLevelService } from "../../services/AthleteLevelService";
import { PersonalRecordService } from "../../services/PersonalRecordService";

export const CacheDataLoader = () => {
  const { user_id } = useAuth();
  const [isSyncComplete, setIsSyncComplete] = useState(false);

  useEffect(() => {
    const syncAllAppData = async () => {
      if (!user_id) return;

      try {
        // These will only hit Supabase if the Session Lock is false
        // AND Dexie is empty.
        await Promise.all([
          LibraryService.syncLibrary(),
          WorkoutService.syncRecentWorkouts(user_id),
          PersonalRecordService.syncPRs(user_id),
          RoutineService.syncRoutine(user_id),
          AthleteLevelService.syncMetadata(),
        ]);

        setIsSyncComplete(true);
      } catch (error) {
        console.error("Sync Error:", error);
        setIsSyncComplete(true);
      }
    };

    syncAllAppData();
  }, [user_id]);

  return isSyncComplete ? <Outlet /> : <SplashScreen />;
};
