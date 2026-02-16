import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import { startOfWeek } from "date-fns";
import type { Database } from "../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];

let isWorkoutSynced = false;

export const WorkoutService = {
  async syncRecentWorkouts(user_id: string, force = false) {
    if (isWorkoutSynced && !force) return;

    const weekStart = startOfWeek(new Date(), {
      weekStartsOn: 1,
    }).toISOString();

    // We check if we have workouts specifically for this week
    const count = await db.workouts
      .where("start_time")
      .above(weekStart)
      .count();
    if (count > 0 && !force) {
      isWorkoutSynced = true;
      return;
    }

    const { data } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", weekStart);

    if (data) {
      await db.workouts.bulkPut(data as Workout[]);
    }

    isWorkoutSynced = true;
  },

  resetLock() {
    isWorkoutSynced = false;
  },
};
