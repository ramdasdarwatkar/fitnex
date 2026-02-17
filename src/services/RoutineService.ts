import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type Routine = Database["public"]["Tables"]["routines"]["Row"];
type RoutineInsert = Database["public"]["Tables"]["routines"]["Insert"];
type RoutineUpdate = Database["public"]["Tables"]["routines"]["Update"];
type RoutineExercise = Database["public"]["Tables"]["routine_exercises"]["Row"];
type RoutineExerciseInsert =
  Database["public"]["Tables"]["routine_exercises"]["Insert"];

export interface EnrichedRoutine extends Routine {
  exercise_count: number;
  muscles: string[];
}

let isRoutineSynced = false;

export const RoutineService = {
  async syncRoutine(user_id: string, force = false) {
    if (isRoutineSynced && !force) return;

    // Fetch from Supabase
    const [r, re] = await Promise.all([
      supabase
        .from("routines")
        .select("*")
        .or(`created_by.eq.${user_id},is_public.eq.true`)
        .eq("status", true) // Only sync active routines
        .order("name", { ascending: true }),
      supabase.from("routine_exercises").select("*"),
    ]);

    if (r.error || re.error) {
      console.error("Sync Error:", r.error || re.error);
      return;
    }

    await db.transaction(
      "rw",
      [db.routines, db.routine_exercises],
      async () => {
        // Clear existing local cache for these specific tables to prevent orphans
        await db.routines.clear();
        await db.routine_exercises.clear();

        if (r.data) await db.routines.bulkPut(r.data as Routine[]);
        if (re.data)
          await db.routine_exercises.bulkPut(re.data as RoutineExercise[]);
      },
    );

    isRoutineSynced = true;
  },

  async getRoutinesWithMeta(): Promise<EnrichedRoutine[]> {
    const [routines, rEx, exMuscles, muscles] = await Promise.all([
      db.routines.filter((r) => r.status !== false).toArray(),
      db.routine_exercises.toArray(),
      db.exercise_muscles.toArray(),
      db.muscles.toArray(),
    ]);

    return routines.map((route) => {
      const linkedExercises = rEx.filter((re) => re.routine_id === route.id);
      const muscleNames = new Set<string>();

      linkedExercises.forEach((link) => {
        exMuscles
          .filter(
            (em) =>
              em.exercise_id === link.exercise_id && em.role === "primary",
          )
          .forEach((em) => {
            const m = muscles.find((m) => m.id === em.muscle_id);
            if (m) muscleNames.add(m.name);
          });
      });

      return {
        ...route,
        exercise_count: linkedExercises.length,
        muscles: Array.from(muscleNames).slice(0, 3),
      } as EnrichedRoutine;
    });
  },

  async getRoutineDetail(id: string) {
    const [routine, routineEx, allExercises] = await Promise.all([
      db.routines.get(id),
      db.routine_exercises
        .where("routine_id")
        .equals(id)
        .sortBy("exercise_order"),
      db.exercises.toArray(),
    ]);

    if (!routine) return null;

    const joinedExercises = routineEx.map((link) => {
      const base = allExercises.find((ex) => ex.id === link.exercise_id);
      return {
        ...link,
        name: base?.name || "Unknown Exercise",
      };
    });

    return { ...routine, exercises: joinedExercises };
  },

  async addRoutine(payload: RoutineInsert, exercises: any[]): Promise<void> {
    const { data: routine, error } = await supabase
      .from("routines")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    const links: RoutineExerciseInsert[] = exercises.map((ex, index) => ({
      routine_id: routine.id,
      exercise_id: ex.id,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      exercise_order: index,
    }));

    await supabase.from("routine_exercises").insert(links);

    await db.transaction(
      "rw",
      [db.routines, db.routine_exercises],
      async () => {
        await db.routines.put(routine as Routine);
        await db.routine_exercises.bulkPut(links as RoutineExercise[]);
      },
    );
  },

  async updateRoutine(
    id: string,
    payload: RoutineUpdate,
    exercises: any[],
  ): Promise<void> {
    const { data: updatedRoutine, error: rErr } = await supabase
      .from("routines")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (rErr) throw rErr;

    await supabase.from("routine_exercises").delete().eq("routine_id", id);

    const links: RoutineExerciseInsert[] = exercises.map((ex, index) => ({
      routine_id: id,
      exercise_id: ex.exercise_id || ex.id,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      exercise_order: index,
    }));

    await supabase.from("routine_exercises").insert(links);

    await db.transaction(
      "rw",
      [db.routines, db.routine_exercises],
      async () => {
        await db.routines.put(updatedRoutine as Routine);
        await db.routine_exercises.where("routine_id").equals(id).delete();
        await db.routine_exercises.bulkPut(links as RoutineExercise[]);
      },
    );
  },

  async archiveRoutine(id: string): Promise<void> {
    const { data, error } = await supabase
      .from("routines")
      .update({ status: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (data) await db.routines.put(data as Routine);
  },

  resetLock() {
    isRoutineSynced = false;
  },
};
