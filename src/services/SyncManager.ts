import { AthleteService } from "./AthleteService";
import { WorkoutService } from "./WorkoutService";

export const SyncManager = {
  /**
   * Orchestrates reconciliation by delegating all data retrieval
   * and network operations to the WorkoutService.
   */
  async reconcile() {
    console.log("🔄 SyncManager: Reconciling...");

    try {
      // 1. Get pending data via Service
      const pendingWorkouts = await WorkoutService.getPendingWorkouts();
      const pendingLogs = await WorkoutService.getPendingLogs();

      // 2. Delegate upload to Service
      if (pendingWorkouts.length > 0) {
        await WorkoutService.pushWorkoutsToSupabase(pendingWorkouts);
        console.log(`✅ Synced ${pendingWorkouts.length} workouts.`);
      }

      if (pendingLogs.length > 0) {
        await WorkoutService.pushLogsToSupabase(pendingLogs);
        console.log(`✅ Synced ${pendingLogs.length} logs.`);
      }

      AthleteService.invalidateStatsCache();
    } catch (error) {
      console.error("❌ SyncManager Error:", error);
    }
  },

  watchConnection() {
    window.addEventListener("online", () => this.reconcile());
  },
};
