import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type Muscle = Database["public"]["Tables"]["muscles"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type ExMuscle = Database["public"]["Tables"]["exercise_muscles"]["Row"];
type ExEquip = Database["public"]["Tables"]["exercise_equipment"]["Row"];

let isLibrarySynced = false;

export const LibraryService = {
  async syncLibrary(force = false) {
    if (isLibrarySynced && !force) return;

    // Check Dexie to see if we have data from a previous session
    const count = await db.muscles.count();
    if (count > 0 && !force) {
      isLibrarySynced = true;
      return;
    }

    const [m, e, ex, exM, exE] = await Promise.all([
      supabase.from("muscles").select("*"),
      supabase.from("equipment").select("*"),
      supabase.from("exercises").select("*"),
      supabase.from("exercise_muscles").select("*"),
      supabase.from("exercise_equipment").select("*"),
    ]);

    await db.transaction(
      "rw",
      [
        db.muscles,
        db.equipment,
        db.exercises,
        db.exercise_muscles,
        db.exercise_equipment,
      ],
      async () => {
        if (m.data) await db.muscles.bulkPut(m.data as Muscle[]);
        if (e.data) await db.equipment.bulkPut(e.data as Equipment[]);
        if (ex.data) await db.exercises.bulkPut(ex.data as Exercise[]);
        if (exM.data) await db.exercise_muscles.bulkPut(exM.data as ExMuscle[]);
        if (exE.data)
          await db.exercise_equipment.bulkPut(exE.data as ExEquip[]);
      },
    );

    isLibrarySynced = true;
  },

  resetLock() {
    isLibrarySynced = false;
  },
};
