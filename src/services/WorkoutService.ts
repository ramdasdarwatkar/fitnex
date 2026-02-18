import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import { startOfWeek } from "date-fns";
import type {
  LocalWorkout,
  LocalWorkoutLog,
  Workout,
} from "../types/database.types";
import { SyncManager } from "./SyncManager";
import { DateUtils } from "../util/dateUtils";

let isWorkoutSynced = false;

export const WorkoutService = {
  // --- READ METHODS ---

  getActiveWorkoutQuery(): Promise<LocalWorkout | null> {
    return db.workouts
      .where("status")
      .equals(1)
      .sortBy("start_time")
      .then((arr) => (arr.length ? arr[arr.length - 1] : null));
  },

  getWorkoutLogsQuery(workoutId: string) {
    return db.workout_logs
      .where("workout_id")
      .equals(workoutId)
      .sortBy("exercise_order"); // Sorted primarily by exercise grouping
  },

  async getPendingWorkouts(): Promise<LocalWorkout[]> {
    return await db.workouts
      .where("is_synced")
      .equals(0)
      .and((w) => w.status === 0)
      .toArray();
  },

  async getPendingLogs(): Promise<LocalWorkoutLog[]> {
    return await db.workout_logs.where("is_synced").equals(0).toArray();
  },

  // --- WRITE METHODS ---

  async startNewWorkout(
    userId: string,
    routineId?: string,
    routineLogs: any[] = [],
  ) {
    const existing = await db.workouts.where("status").equals(1).first();
    if (existing) return existing.id;

    const workoutId = crypto.randomUUID();
    const now = DateUtils.getISTDate();

    await db.workouts.put({
      id: workoutId,
      user_id: userId,
      routine_id: routineId || null,
      start_time: now,
      finish_time: "",
      status: 1,
      rest_day: 0,
      is_synced: 0,
      created_at: now,
      updated_at: null,
    } as any);

    if (routineLogs.length > 0) {
      const logsData = routineLogs.map((l, idx) => ({
        ...l,
        id: crypto.randomUUID(),
        workout_id: workoutId,
        exercise_order: l.exercise_order ?? idx,
        set_number: l.set_number || 1,
        is_synced: 0,
        completed: 0,
      }));
      await db.workout_logs.bulkPut(logsData as any);
    }
    return workoutId;
  },

  async addExercisesToActive(workoutId: string, exerciseIds: string[]) {
    const logs = await db.workout_logs
      .where("workout_id")
      .equals(workoutId)
      .toArray();
    const maxOrder =
      logs.length > 0
        ? Math.max(...logs.map((l) => l.exercise_order || 0))
        : -1;

    const newLogs = exerciseIds.map((id, index) => ({
      id: crypto.randomUUID(),
      workout_id: workoutId,
      exercise_id: id,
      set_number: 1,
      reps: 10,
      weight: 0,
      exercise_order: maxOrder + 1 + index,
      is_synced: 0,
      completed: 0,
      created_at: DateUtils.getISTDate(),
      updated_at: null,
    }));
    return await db.workout_logs.bulkPut(newLogs as any);
  },

  async addSet(workoutId: string, exerciseId: string, nextSetNumber: number) {
    // 1. Get the last set to clone its weight/reps as a baseline
    const lastSet = await db.workout_logs
      .where({ workout_id: workoutId, exercise_id: exerciseId })
      .reverse()
      .first();

    const existingGroup = await db.workout_logs
      .where({ workout_id: workoutId, exercise_id: exerciseId })
      .first();

    return await db.workout_logs.add({
      id: crypto.randomUUID(),
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: nextSetNumber,
      exercise_order: existingGroup?.exercise_order || 0,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      distance: lastSet?.distance || 0,
      duration: lastSet?.duration || 0,
      completed: 0, // CRITICAL: Always start uncompleted
      is_synced: 0,
      created_at: DateUtils.getISTDate(),
      updated_at: null,
    } as any);
  },

  async updateLog(log: LocalWorkoutLog) {
    // Mark as dirty so SyncManager picks it up
    return await db.workout_logs.put({
      ...log,
      is_synced: 0,
    });
  },

  async deleteSet(setId: string) {
    return await db.workout_logs.delete(setId);
  },

  async deleteExercise(workoutId: string, exerciseId: string) {
    return await db.workout_logs
      .where({ workout_id: workoutId, exercise_id: exerciseId })
      .delete();
  },

  async finishWorkout(
    workoutId: string,
    notes: string,
    customTimes?: { start: string; end: string },
  ) {
    const updateData: any = { notes, status: 0, is_synced: 0 };
    if (customTimes) {
      updateData.start_time = customTimes.start;
      updateData.finish_time = customTimes.end;
    } else {
      updateData.finish_time = DateUtils.getISTDate();
    }
    await db.workouts.update(workoutId, updateData);

    // Trigger sync immediately upon finishing
    SyncManager.watchConnection();
    SyncManager.reconcile();
  },

  async discardWorkout(workoutId: string) {
    return await db.transaction(
      "rw",
      [db.workouts, db.workout_logs],
      async () => {
        await db.workout_logs.where("workout_id").equals(workoutId).delete();
        await db.workouts.delete(workoutId);
      },
    );
  },

  // --- SYNC METHODS ---

  async syncRecentWorkouts(user_id: string, force = false) {
    if (isWorkoutSynced && !force) return;
    const weekStart = startOfWeek(new Date(), {
      weekStartsOn: 1,
    }).toISOString();

    const count = await db.workouts
      .where("start_time")
      .above(weekStart)
      .count();

    if (count > 0 && !force) {
      isWorkoutSynced = true;
      return;
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", weekStart);

    if (error) throw error;
    if (data) {
      const syncedData = data.map((w: Workout) => ({
        ...w,
        is_synced: 1,
        status: w.status ? 1 : 0,
      }));
      await db.workouts.bulkPut(syncedData);
    }
    isWorkoutSynced = true;
  },

  async syncPRs(userId: string) {
    const { data, error } = await supabase
      .from("v_latest_personal_records")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error syncing latest PRs:", error);
      return;
    }

    if (data) {
      await db.transaction("rw", db.latest_personal_record, async () => {
        await db.latest_personal_record.clear();
        await db.latest_personal_record.bulkPut(data);
      });
    }
  },

  async checkPR(userId: string, exerciseId: string, weight: number) {
    const existingPR = await db.latest_personal_record.get(exerciseId);

    if (!existingPR || weight > existingPR.value) {
      const now = DateUtils.getISTDate();
      const prId = crypto.randomUUID(); // Added ID for Supabase table primary key

      const newPR = {
        user_id: userId,
        exercise_id: exerciseId,
        value: weight,
        record_date: now,
      };

      // 1. Update lean cache
      await db.latest_personal_record.put(newPR);

      // 2. Insert into history table
      await supabase.from("personal_record").insert(newPR);

      return true;
    }
    return false;
  },

  resetLock() {
    isWorkoutSynced = false;
  },
};
