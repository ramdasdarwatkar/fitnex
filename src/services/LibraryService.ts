import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

// Database Row Types
type Muscle = Database["public"]["Tables"]["muscles"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type ExMuscle = Database["public"]["Tables"]["exercise_muscles"]["Row"];
type ExEquip = Database["public"]["Tables"]["exercise_equipment"]["Row"];

// Insert/Update Types
type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"];
type ExMuscleInsert =
  Database["public"]["Tables"]["exercise_muscles"]["Insert"];
type ExEquipInsert =
  Database["public"]["Tables"]["exercise_equipment"]["Insert"];

let isLibrarySynced = false;

export interface EnrichedExercise extends Exercise {
  all_muscles: {
    name: string;
    parent_name: string | null;
    role: "primary" | "secondary" | "stabilizer";
  }[];
  equipment_name: string;
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

  // --- READ OPERATIONS (LOCAL FIRST) ---

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
        // FIX: Filter by status here so archived exercises are excluded
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
      junctions.push(supabase.from("exercise_muscles").insert(inserts));
      junctions.push(db.exercise_muscles.bulkPut(inserts as ExMuscle[]));
    }

    if (equipmentId) {
      const insert: ExEquipInsert = {
        exercise_id: exercise.id,
        equipment_id: parseInt(equipmentId),
      };
      junctions.push(supabase.from("exercise_equipment").insert([insert]));
      junctions.push(db.exercise_equipment.put(insert as ExEquip));
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

    // Atomic Junction Sync
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

  resetLock(): void {
    isLibrarySynced = false;
  },
};
