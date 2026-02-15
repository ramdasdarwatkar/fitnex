import { useAuth } from "../context/AuthContext";
import { AthleteLevelService } from "../services/AthleteLevelService";
import { BodyMetricsService } from "../services/BodyMetricsService";
import { UserProfileService } from "../services/UserProfileService";
import type { Database } from "../types/database.types";

type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];
type MetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];
type LevelInsert = Database["public"]["Tables"]["athlete_level"]["Insert"];

export const useOnboarding = () => {
  const { refreshAthlete } = useAuth();

  const saveOnboarding = async (
    profile: ProfileInsert,
    metrics: MetricsInsert,
    level: LevelInsert,
  ) => {
    try {
      // 1. Call individual services in parallel
      const results = await Promise.all([
        UserProfileService.updateProfile(profile),
        BodyMetricsService.updateMetrics(metrics),
        AthleteLevelService.updateLevel(level),
      ]);

      // 2. Check for any errors across services
      const error = results.find((r) => r.error)?.error;
      if (error) throw new Error(error.message);

      // 3. Trigger Global Force Sync
      // This bypasses Dexie, pulls fresh View data, and updates state
      await refreshAthlete();

      return { success: true };
    } catch (err: any) {
      console.error("Onboarding Service Error:", err);
      return { success: false, error: err.message };
    }
  };

  return { saveOnboarding };
};
