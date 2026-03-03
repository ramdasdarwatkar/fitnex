import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { LocalWorkout } from "../types/database.types";
import { SyncManager } from "./SyncManager";
import { DateUtils } from "../util/dateUtils";
import { WorkoutLogsService } from "./WorkoutLogsService";

export const WorkoutService = {
  // --- READ METHODS ---

  getActiveWorkoutQuery(): Promise<LocalWorkout | null> {
    return db.workouts
      .where("status")
      .equals(1)
      .sortBy("start_time")
      .then((arr) => (arr.length ? arr[arr.length - 1] : null));
  },

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

    await WorkoutLogsService.createWorkoutLogsFromRoutine(
      workoutId,
      routineLogs,
    );
    return workoutId;
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
    SyncManager.reconcile();
  },

  async discardWorkout(workoutId: string) {
    return await db.transaction(
      "rw",
      [db.workouts, db.workout_logs],
      async () => {
        await WorkoutLogsService.deleteLogsByWorkoutId(workoutId);
        await db.workouts.delete(workoutId);
      },
    );
  },

  async getWorkoutsInRange(userId: string, startDate: string, endDate: string) {
    try {
      const localCount = await db.workout_history
        .where("start_time")
        .between(startDate, endDate, true, true)
        .count();

      if (localCount > 0) {
        return await db.workout_history
          .where("start_time")
          .between(startDate, endDate, true, true)
          .toArray();
      }

      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", `${startDate}T00:00:00Z`)
        .lte("start_time", `${endDate}T23:59:59Z`);

      if (error) throw error;
      if (data && data.length > 0) {
        await db.transaction("rw", db.workout_history, async () => {
          await db.workout_history.bulkPut(data);
        });
      }
      return data || [];
    } catch (err) {
      console.error("Vault range fetch failed:", err);
      return [];
    }
  },

  async getWorkoutDetails(workoutId: string) {
    const { data, error } = await supabase
      .from("workout_logs")
      .select(`*, exercise:exercises (name, category)`)
      .eq("workout_id", workoutId)
      .order("exercise_order", { ascending: true })
      .order("set_number", { ascending: true });

    if (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
    return data || [];
  },

  async rePerformWorkout(userId: string, logs: any[]) {
    if (!logs || logs.length === 0) return;
    const newWorkoutId = await this.startNewWorkout(userId);
    await WorkoutLogsService.reperformOldWorkout(newWorkoutId, logs);
    return newWorkoutId;
  },

  async logRestDay(userId: string) {
    const now = DateUtils.getISTDate();
    const payload: any = {
      id: crypto.randomUUID(),
      user_id: userId,
      rest_day: true,
      status: false,
      start_time: now,
      finish_time: now,
      created_at: now,
      updated_at: now,
    };
    const { error } = await supabase.from("workouts").insert(payload);
    await db.workouts.put({
      ...payload,
      status: 0,
      is_synced: error ? 0 : 1,
      rest_day: 1,
    });
  },

  async getExerciseHistory(userId: string, exerciseId: string) {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        id,
        start_time,
        logs:workout_logs!inner(
          exercise_id,
          set_number,weight,reps,distance,duration
        )
      `,
      )
      .eq("user_id", userId)
      .eq("logs.exercise_id", exerciseId)
      .order("start_time", { ascending: false });

    if (error) throw error;
    return data;
  },
};
