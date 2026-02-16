import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Insert"];
type Log = Database["public"]["Tables"]["workout_logs"]["Insert"];

export const WorkoutService = {
  // 1. Initialize a new session
  async createSession(userId: string, routineId?: string): Promise<Workout> {
    const now = new Date().toISOString();
    return {
      user_id: userId,
      routine_id: routineId || null,
      start_time: now,
      finish_time: now, // Will be updated on finish
      status: true, // true = active/ongoing
      rest_day: false,
    };
  },

  // 2. Start Live Workout
  async startLiveWorkout(userId: string, routineId?: string) {
    const session = await this.createSession(userId, routineId);
    // In a real app, you'd save this 'session' to Dexie/LocalStorage here
    return session;
  },

  // 3. Complete and Sync to Supabase
  async finishWorkout(workout: Workout, logs: Log[]) {
    // 1. Insert Workout header
    const { data: wData, error: wError } = await supabase
      .from("workouts")
      .insert({
        ...workout,
        status: false,
        finish_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (wError) throw wError;

    // 2. Insert all logs linked to the new Workout ID
    const finalizedLogs = logs.map((log) => ({ ...log, workout_id: wData.id }));
    const { error: lError } = await supabase
      .from("workout_logs")
      .insert(finalizedLogs);

    if (lError) throw lError;
    return wData;
  },

  // 4. Mark Rest Day
  async logRestDay(userId: string) {
    const now = new Date().toISOString();
    return await supabase.from("workouts").insert({
      user_id: userId,
      rest_day: true,
      status: false,
      start_time: now,
      finish_time: now,
    });
  },
};
