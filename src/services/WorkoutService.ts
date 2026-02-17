import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import { startOfWeek } from "date-fns";
import type {
  Database,
  LocalWorkout,
  LocalWorkoutLog,
  Workout,
} from "../types/database.types";
import { SyncManager } from "./SyncManager";

let isWorkoutSynced = false;
type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];

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
      .sortBy("sort_order");
  },

  // --- WRITE METHODS ---

  async startNewWorkout(
    userId: string,
    routineId?: string,
    routineLogs: any[] = [],
  ) {
    // SAFETY: Prevent multiple active sessions
    const existing = await db.workouts.where("status").equals(1).first();
    if (existing) return existing.id;

    const workoutId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.workouts.put({
      id: workoutId,
      user_id: userId,
      routine_id: routineId || null,
      start_time: now,
      finish_time: "",
      status: 1,
      is_synced: 0,
    });

    if (routineLogs.length > 0) {
      const logsData = routineLogs.map((l, idx) => ({
        ...l,
        id: crypto.randomUUID(),
        workout_id: workoutId,
        sort_order: idx,
        is_synced: 0,
        completed: 0,
      }));
      await db.workout_logs.bulkPut(logsData as any);
    }
    return workoutId;
  },

  async addExercisesToActive(workoutId: string, exerciseIds: string[]) {
    const baseOrder = Date.now();
    const newLogs = exerciseIds.map((id, index) => ({
      id: crypto.randomUUID(),
      workout_id: workoutId,
      exercise_id: id,
      set_number: 1,
      reps: 10,
      sort_order: baseOrder + index,
      is_synced: 0,
      completed: 0,
    }));
    return await db.workout_logs.bulkPut(newLogs as any);
  },

  async addSet(workoutId: string, exerciseId: string, nextSetNumber: number) {
    return await db.workout_logs.add({
      id: crypto.randomUUID(),
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: nextSetNumber,
      reps: 10,
      sort_order: Date.now(),
      completed: 0,
      is_synced: 0,
    });
  },

  async updateLog(log: LocalWorkoutLog) {
    return await db.workout_logs.put(log);
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
    const updateData: any = {
      notes,
      status: 0,
      is_synced: 0,
    };

    if (customTimes) {
      updateData.start_time = customTimes.start;
      updateData.finish_time = customTimes.end;
    } else {
      updateData.finish_time = new Date().toISOString();
    }
    await db.workouts.update(workoutId, updateData);
    // 2. Listen for 'online' events to retry sync automatically
    SyncManager.watchConnection();
    // 2. Listen for 'online' events to retry sync automatically
    SyncManager.reconcile();
    return;
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

  // --- UTILS ---

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

  async logRestDay(userId: string) {
    const now = new Date().toISOString();
    const payload: any = {
      id: crypto.randomUUID(),
      user_id: userId,
      rest_day: true,
      status: false,
      start_time: now,
      finish_time: now,
    };

    const { error } = await supabase.from("workouts").insert(payload);
    await db.workouts.put({ ...payload, status: 0, is_synced: error ? 0 : 1 });
  },

  /** * Pushes specific workouts to Supabase, mapping local 1/0 to booleans.
   */
  async pushWorkoutsToSupabase(localWorkouts: LocalWorkout[]) {
    const workoutsToUpload = localWorkouts.map(
      ({ is_synced, status, ...rest }) => ({
        ...rest,
        status: false, // Locally 0 always means finished/false for Supabase
      }),
    );

    const { error } = await supabase.from("workouts").upsert(workoutsToUpload);
    if (error) throw error;

    const ids = localWorkouts.map((w) => w.id);
    await db.workouts.where("id").anyOf(ids).modify({ is_synced: 1 });
  },

  /** * Pushes specific logs to Supabase, mapping local 1/0 to booleans.
   */
  async pushLogsToSupabase(localLogs: LocalWorkoutLog[]) {
    const logsToUpload = localLogs.map(({ is_synced, completed, ...rest }) => ({
      ...rest,
    }));

    console.log("logsToUpload : ", ...logsToUpload);

    const { error } = await supabase.from("workout_logs").upsert(logsToUpload);
    if (error) throw error;

    const ids = localLogs.map((l) => l.id);
    await db.workout_logs.where("id").anyOf(ids).modify({ is_synced: 1 });
  },

  resetLock() {
    isWorkoutSynced = false;
  },
};
