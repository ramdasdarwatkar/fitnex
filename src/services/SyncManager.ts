import { db } from "../db/database";
import { WorkoutService } from "./WorkoutService";

export const SyncManager = {
  async reconcile() {
    console.log("🔄 SyncManager: Checking for unsynced data...");

    try {
      // 1. Handle Workouts
      const pendingWorkouts = await db.workouts
        .where("is_synced")
        .equals(0)
        .and((w) => w.status === 0)
        .toArray();

      if (pendingWorkouts.length > 0) {
        await WorkoutService.pushWorkoutsToSupabase(pendingWorkouts);
        console.log(`✅ Synced ${pendingWorkouts.length} workouts.`);
      }

      // 2. Handle Logs
      const pendingLogs = await db.workout_logs
        .where("is_synced")
        .equals(0)
        .toArray();

      if (pendingLogs.length > 0) {
        await WorkoutService.pushLogsToSupabase(pendingLogs);
        console.log(`✅ Synced ${pendingLogs.length} logs.`);
      }
    } catch (error) {
      console.error("❌ SyncManager Error:", error);
    }
  },

  watchConnection() {
    window.addEventListener("online", () => this.reconcile());
  },
};
