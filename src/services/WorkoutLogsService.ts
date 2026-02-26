import { db } from "../db/database";
import type { LocalWorkoutLog } from "../types/database.types";
import { DateUtils } from "../util/dateUtils";

export const WorkoutLogsService = {
  getWorkoutLogsQuery(workoutId: string) {
    return db.workout_logs
      .where("workout_id")
      .equals(workoutId)
      .sortBy("exercise_order", "set_number");
  },

  async createWorkoutLogsFromRoutine(workoutId: string, routineLogs: any) {
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
      reps: null,
      weight: null,
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
      reps: lastSet?.reps || null,
      weight: lastSet?.weight || null,
      distance: lastSet?.distance || null,
      duration: lastSet?.duration || null,
      completed: 0,
      is_synced: 0,
      created_at: DateUtils.getISTDate(),
      updated_at: null,
    } as any);
  },

  async updateLog(log: LocalWorkoutLog) {
    return await db.workout_logs.put({ ...log, is_synced: 0 });
  },

  async deleteLogsByWorkoutId(workoutId: string) {
    return await db.workout_logs.where("workout_id").equals(workoutId).delete();
  },

  async reperformOldWorkout(newWorkoutId: string, logs: any) {
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
  },

  async deleteSet(setId: string) {
    return await db.workout_logs.delete(setId);
  },

  async removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
    return await db.workout_logs
      .where({ workout_id: workoutId, exercise_id: exerciseId })
      .delete();
  },
};
