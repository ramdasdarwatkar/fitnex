import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type Routine = Database["public"]["Tables"]["routines"]["Row"];
type RoutineEx = Database["public"]["Tables"]["routine_exercises"]["Row"];

let isRoutineSynced = false;

export const RoutineService = {
  async syncRoutine(user_id: string, force = false) {
    if (isRoutineSynced && !force) return;

    const count = await db.routines.count();
    if (count > 0 && !force) {
      isRoutineSynced = true;
      return;
    }

    const [r, re] = await Promise.all([
      supabase.from("routines").select("*").eq("user_id", user_id),
      supabase.from("routine_exercises").select("*"),
    ]);

    await db.transaction(
      "rw",
      [db.routines, db.routine_exercises],
      async () => {
        if (r.data) await db.routines.bulkPut(r.data as Routine[]);
        if (re.data) await db.routine_exercises.bulkPut(re.data as RoutineEx[]);
      },
    );

    isRoutineSynced = true;
  },

  resetLock() {
    isRoutineSynced = false;
  },
};
