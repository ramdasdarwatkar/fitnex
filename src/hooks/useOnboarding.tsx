import { SyncManager } from "../services/SyncManager";
import { UserProfileService } from "../services/UserProfileService";
import { BodyMetricsService } from "../services/BodyMetricsService";
import { AthleteLevelService } from "../services/AthleteLevelService";
import type {
  UserProfile,
  BodyMetrics,
  AthleteLevel,
} from "../types/database.types";
import { useAuth } from "./useAuth";

/**
 * Result interface for the saveOnboarding function
 */
interface OnboardingResult {
  success: boolean;
  error?: string;
}

export const useOnboarding = () => {
  const { user_id } = useAuth();

  const saveOnboarding = async (
    profile: UserProfile,
    metrics: BodyMetrics,
    level: AthleteLevel,
  ): Promise<OnboardingResult> => {
    try {
      if (!user_id) {
        throw new Error("Cannot save onboarding: No active user session.");
      }

      // 1. Transactional Local Write
      // These services write to Dexie with is_synced: 0
      await Promise.all([
        UserProfileService.saveLocalProfile(profile),
        BodyMetricsService.saveLocalMetrics(metrics),
        AthleteLevelService.saveLocalLevel(level),
      ]);

      // 2. Immediate Background Reconciliation
      // If online, this pushes the local 'dirty' rows to Supabase.
      if (window.navigator.onLine) {
        await SyncManager.reconcile();
      }

      return { success: true };
    } catch (err: unknown) {
      // FIX: Handle the 'unknown' error type safely
      let errorMessage = "An unexpected error occurred during onboarding.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      console.error("Critical Onboarding Failure:", errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return { saveOnboarding };
};
