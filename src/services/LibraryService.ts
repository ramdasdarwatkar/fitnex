import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

// Database Row Types
type Muscle = Database["public"]["Tables"]["muscles"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type ExMuscle = Database["public"]["Tables"]["exercise_muscles"]["Row"];
type ExEquip = Database["public"]["Tables"]["exercise_equipment"]["Row"];
type Routine = Database["public"]["Tables"]["routines"]["Row"];
type RoutineExercise = Database["public"]["Tables"]["routine_exercises"]["Row"];

// Insert/Update Types for Payload Safety
type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"];
type ExMuscleInsert =
  Database["public"]["Tables"]["exercise_muscles"]["Insert"];
type ExEquipInsert =
  Database["public"]["Tables"]["exercise_equipment"]["Insert"];
type RoutineInsert = Database["public"]["Tables"]["routines"]["Insert"];
type RoutineUpdate = Database["public"]["Tables"]["routines"]["Update"];
type RoutineExerciseInsert =
  Database["public"]["Tables"]["routine_exercises"]["Insert"];

let isLibrarySynced = false;

/**
 * Interface for the enriched Exercise object used in UI
 */
export interface EnrichedExercise extends Exercise {
  all_muscles: {
    name: string;
    parent_name: string | null;
    role: "primary" | "secondary" | "stabilizer";
  }[];
  equipment_name: string;
}

export interface EnrichedRoutine extends Routine {
  exercise_count: number;
  muscles: string[];
}

export const LibraryService = {
  /**
   * INITIAL SYNC: Only runs once per session unless forced.
   * Downloads full library. Optimized to check local count first to save egress.
   */
  async syncLibrary(force = false): Promise<void> {
    if (isLibrarySynced && !force) return;
    const count = await db.muscles.count();
    if (count > 0 && !force) {
      isLibrarySynced = true;
      return;
    }

    const [m, e, ex, exM, exE, r, rEx] = await Promise.all([
      supabase.from("muscles").select("*"),
      supabase.from("equipment").select("*"),
      supabase.from("exercises").select("*"),
      supabase.from("exercise_muscles").select("*"),
      supabase.from("exercise_equipment").select("*"),
      supabase.from("routines").select("*"),
      supabase.from("routine_exercises").select("*"),
    ]);

    await db.transaction(
      "rw",
      [
        db.muscles,
        db.equipment,
        db.exercises,
        db.exercise_muscles,
        db.exercise_equipment,
        db.routines,
        db.routine_exercises,
      ],
      async () => {
        if (m.data) await db.muscles.bulkPut(m.data as Muscle[]);
        if (e.data) await db.equipment.bulkPut(e.data as Equipment[]);
        if (ex.data) await db.exercises.bulkPut(ex.data as Exercise[]);
        if (exM.data) await db.exercise_muscles.bulkPut(exM.data as ExMuscle[]);
        if (exE.data)
          await db.exercise_equipment.bulkPut(exE.data as ExEquip[]);
        if (r.data) await db.routines.bulkPut(r.data as Routine[]);
        if (rEx.data)
          await db.routine_exercises.bulkPut(rEx.data as RoutineExercise[]);
      },
    );
    isLibrarySynced = true;
  },

  // --- READ OPERATIONS (LOCAL FIRST) ---

  async getActiveWorkout() {
    // Check for any workout that hasn't ended
    return await db.workouts.filter((w) => !w.end_time).first();
  },

  async getActiveMuscles(): Promise<Muscle[]> {
    return await db.muscles.filter((m) => m.status !== false).toArray();
  },

  async getMuscleById(id: string): Promise<Muscle | undefined> {
    return await db.muscles.get(id);
  },

  async getAllEquipment(): Promise<Equipment[]> {
    return await db.equipment.toArray();
  },

  async getExercisesWithMeta(): Promise<EnrichedExercise[]> {
    const [exercises, exMuscles, exEquip, muscles, equipment] =
      await Promise.all([
        db.exercises.filter((ex) => ex.status !== false).toArray(),
        db.exercise_muscles.toArray(),
        db.exercise_equipment.toArray(),
        db.muscles.toArray(),
        db.equipment.toArray(),
      ]);

    return exercises.map((ex) => {
      const muscleLinks = exMuscles.filter((em) => em.exercise_id === ex.id);
      const allMuscles = muscleLinks.map((link) => {
        const muscle = muscles.find((m) => m.id === link.muscle_id);
        const parent = muscle?.parent
          ? muscles.find((p) => p.id === muscle.parent)
          : null;
        return {
          name: muscle?.name || "Unknown",
          parent_name: parent?.name || null,
          role: link.role as "primary" | "secondary" | "stabilizer",
        };
      });

      const equipLink = exEquip.find((ee) => ee.exercise_id === ex.id);
      const equip = equipment.find((e) => e.id === equipLink?.equipment_id);

      return {
        ...ex,
        all_muscles: allMuscles,
        equipment_name: equip?.name || "None",
      } as EnrichedExercise;
    });
  },

  async getExerciseDetail(id: string) {
    const [exercise, exMuscles, exEquip, muscles, equipment] =
      await Promise.all([
        db.exercises.get(id),
        db.exercise_muscles.where("exercise_id").equals(id).toArray(),
        db.exercise_equipment.where("exercise_id").equals(id).toArray(),
        db.muscles.toArray(),
        db.equipment.toArray(),
      ]);

    if (!exercise) return null;

    return {
      ...exercise,
      muscles: exMuscles.map((link) => ({
        id: link.muscle_id,
        name: muscles.find((m) => m.id === link.muscle_id)?.name || "Unknown",
        role: link.role as "primary" | "secondary" | "stabilizer",
      })),
      equipmentId: exEquip[0]?.equipment_id?.toString() || "",
    };
  },

  // --- ATOMIC WRITE OPERATIONS (EGRESS OPTIMIZED) ---

  async addMuscle(name: string, parentId: string | null): Promise<Muscle> {
    const payload: Database["public"]["Tables"]["muscles"]["Insert"] = {
      name,
      parent: parentId || null,
    };
    const { data, error } = await supabase
      .from("muscles")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    await db.muscles.put(data as Muscle);
    return data as Muscle;
  },

  async updateMuscle(
    id: string,
    name: string,
    parentId: string | null,
  ): Promise<void> {
    const payload: Database["public"]["Tables"]["muscles"]["Update"] = {
      name,
      parent: parentId || null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("muscles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await db.muscles.put(data as Muscle);
  },

  async archiveMuscle(id: string): Promise<void> {
    const { data, error } = await supabase
      .from("muscles")
      .update({ status: false })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await db.muscles.put(data as Muscle);
  },

  async addExercise(
    payload: ExerciseInsert,
    muscles: any[],
    equipmentId: string | null,
  ): Promise<Exercise> {
    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .insert([payload])
      .select()
      .single();
    if (exErr) throw exErr;

    await db.exercises.put(exercise as Exercise);

    const junctions: Promise<any>[] = [];
    if (muscles.length > 0) {
      const inserts: ExMuscleInsert[] = muscles.map((m) => ({
        exercise_id: exercise.id,
        muscle_id: m.id,
        role: m.role,
      }));
      junctions.push(
        supabase
          .from("exercise_muscles")
          .insert(inserts)
          .then(() => db.exercise_muscles.bulkPut(inserts as ExMuscle[])),
      );
    }

    if (equipmentId) {
      const insert: ExEquipInsert = {
        exercise_id: exercise.id,
        equipment_id: parseInt(equipmentId),
      };
      junctions.push(
        supabase
          .from("exercise_equipment")
          .insert([insert])
          .then(() => db.exercise_equipment.put(insert as ExEquip)),
      );
    }

    await Promise.all(junctions);
    return exercise as Exercise;
  },

  async updateExercise(
    id: string,
    payload: ExerciseUpdate,
    muscles: { id: string; role: string }[],
    equipmentId: string | null,
  ): Promise<void> {
    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (exErr) throw exErr;

    await db.exercises.put(exercise as Exercise);

    // Sync Junctions (Atomic Wipe & Replace)
    await Promise.all([
      supabase.from("exercise_muscles").delete().eq("exercise_id", id),
      db.exercise_muscles.where("exercise_id").equals(id).delete(),
    ]);

    if (muscles.length > 0) {
      const inserts: ExMuscleInsert[] = muscles.map((m) => ({
        exercise_id: id,
        muscle_id: m.id,
        role: m.role as any,
      }));
      await supabase.from("exercise_muscles").insert(inserts);
      await db.exercise_muscles.bulkPut(inserts as ExMuscle[]);
    }

    await Promise.all([
      supabase.from("exercise_equipment").delete().eq("exercise_id", id),
      db.exercise_equipment.where("exercise_id").equals(id).delete(),
    ]);

    if (equipmentId) {
      const insert: ExEquipInsert = {
        exercise_id: id,
        equipment_id: parseInt(equipmentId),
      };
      await supabase.from("exercise_equipment").insert([insert]);
      await db.exercise_equipment.put(insert as ExEquip);
    }
  },

  async archiveExercise(id: string): Promise<void> {
    const { data, error } = await supabase
      .from("exercises")
      .update({ status: false })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await db.exercises.put(data as Exercise);
  },

  // --- ROUTINE OPERATIONS ---

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

  async addRoutine(
    payload: RoutineInsert,
    exercises: { id: string; target_sets: number; target_reps: number }[],
  ): Promise<void> {
    const { data: routine, error } = await supabase
      .from("routines")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;

    if (exercises.length > 0) {
      const links: RoutineExerciseInsert[] = exercises.map((ex, index) => ({
        routine_id: routine.id,
        exercise_id: ex.id,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        sort_order: index,
      }));

      await supabase.from("routine_exercises").insert(links);

      // Atomic Local Patch
      await db.routines.put(routine as Routine);
      await db.routine_exercises.bulkPut(links as RoutineExercise[]);
    }
  },

  /**
   * Fetches full routine details including the linked exercises and their targets
   */
  async getRoutineDetail(id: string) {
    const [routine, routineEx, allExercises] = await Promise.all([
      db.routines.get(id),
      db.routine_exercises.where("routine_id").equals(id).sortBy("sort_order"),
      db.exercises.toArray(),
    ]);

    if (!routine) return null;

    // Join exercise names and data for the UI
    const joinedExercises = routineEx.map((link) => {
      const base = allExercises.find((ex) => ex.id === link.exercise_id);
      return {
        ...link,
        name: base?.name || "Unknown Exercise",
      };
    });

    return {
      ...routine,
      exercises: joinedExercises,
    };
  },

  /**
   * Atomic Update: Updates the routine name/desc and replaces all exercise links
   */
  async updateRoutine(
    id: string,
    payload: RoutineUpdate,
    exercises: {
      exercise_id: string;
      target_sets: number;
      target_reps: number;
    }[],
  ): Promise<void> {
    // 1. Remote Update Routine Header
    const { data: updatedRoutine, error: rErr } = await supabase
      .from("routines")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (rErr) throw rErr;

    // 2. Atomic Junction Sync (Remote)
    // Delete existing links and insert new ones in order
    await supabase.from("routine_exercises").delete().eq("routine_id", id);

    const links: RoutineExerciseInsert[] = exercises.map((ex, index) => ({
      routine_id: id,
      exercise_id: ex.exercise_id,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      sort_order: index,
    }));

    const { error: linkErr } = await supabase
      .from("routine_exercises")
      .insert(links);
    if (linkErr) throw linkErr;

    // 3. Local Sync (Dexie)
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

  /**
   * Soft-delete a routine
   */
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

  resetLock(): void {
    isLibrarySynced = false;
  },
};
