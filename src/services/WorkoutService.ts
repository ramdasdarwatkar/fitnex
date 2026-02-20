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
      .sortBy("exercise_order", "set_number");
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
      completed: 0,
      is_synced: 0,
      created_at: DateUtils.getISTDate(),
      updated_at: null,
    } as any);
  },

  async updateLog(log: LocalWorkoutLog) {
    return await db.workout_logs.put({ ...log, is_synced: 0 });
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

  // --- ACTIVITY VAULT / RANGE METHODS ---

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
    const newLogs = logs.map((log: any) => ({
      id: crypto.randomUUID(),
      workout_id: newWorkoutId,
      exercise_id: log.exercise_id,
      weight: log.weight,
      reps: log.reps,
      set_number: log.set_number,
      exercise_order: log.exercise_order,
      completed: 0,
      created_at: DateUtils.getISTDate(),
    }));
    await db.workout_logs.bulkPut(newLogs as any);
    return newWorkoutId;
  },

  // --- SUPABASE SYNC (PUSH) METHODS ---

  async pushWorkoutsToSupabase(localWorkouts: LocalWorkout[]) {
    const workoutsToUpload = localWorkouts.map(
      ({ is_synced, status, rest_day, ...rest }) => ({
        ...rest,
        status: false,
        rest_day: !!rest_day,
      }),
    );
    const { error } = await supabase.from("workouts").upsert(workoutsToUpload);
    if (error) throw error;
    const ids = localWorkouts.map((w) => w.id);
    await db.workouts.where("id").anyOf(ids).modify({ is_synced: 1 });
  },

  async pushLogsToSupabase(localLogs: LocalWorkoutLog[]) {
    const logsToUpload = localLogs.map(({ is_synced, completed, ...rest }) => ({
      ...rest,
    }));
    const { error } = await supabase.from("workout_logs").upsert(logsToUpload);
    if (error) throw error;
    const ids = localLogs.map((l) => l.id);
    await db.workout_logs.where("id").anyOf(ids).modify({ is_synced: 1 });
  },

  // --- SYNC RECENT / WEEKLY ---

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

  // --- PERSONAL RECORDS ---

  async syncPRs(userId: string) {
    const { data, error } = await supabase
      .from("v_latest_personal_records")
      .select("*")
      .eq("user_id", userId);

    if (error) return;
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
      const newPR = {
        user_id: userId,
        exercise_id: exerciseId,
        value: weight,
        record_date: now,
      };
      await db.latest_personal_record.put(newPR);
      await supabase.from("personal_record").insert(newPR);
      return true;
    }
    return false;
  },

  resetLock() {
    isWorkoutSynced = false;
  },
};
