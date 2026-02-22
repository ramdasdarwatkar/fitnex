import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";
import { v4 as uuidv4 } from "uuid";

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

    const [m, e, ex, exM, exE, rEx] = await Promise.all([
      supabase.from("muscles").select("*"),
      supabase.from("equipment").select("*"),
      supabase.from("exercises").select("*"),
      supabase.from("exercise_muscles").select("*"),
      supabase.from("exercise_equipment").select("*"),
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
        db.routine_exercises,
      ],
      async () => {
        if (m.data) await db.muscles.bulkPut(m.data as Muscle[]);
        if (e.data) await db.equipment.bulkPut(e.data as Equipment[]);
        if (ex.data) await db.exercises.bulkPut(ex.data as Exercise[]);
        if (exM.data) await db.exercise_muscles.bulkPut(exM.data as ExMuscle[]);
        if (exE.data)
          await db.exercise_equipment.bulkPut(exE.data as ExEquip[]);
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

  async saveExercise(formData: any, userId: string) {
    const exerciseId = uuidv4();

    // Helper to map tracking metrics to boolean values
    const hasMetric = (val: string) => formData.tracking.includes(val);

    const payload = {
      id: exerciseId,
      added_by: userId,
      name: formData.name,
      category: formData.category,
      is_public: formData.isPublic,
      reps: hasMetric("reps"),
      weight: hasMetric("weight"),
      bodyweight: hasMetric("bodyweight"),
      distance: hasMetric("distance"),
      duration: hasMetric("duration"),
      updated_at: new Date().toISOString(),
      status: true,
    };

    // 1. Save Main Exercise to Supabase
    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .insert([payload])
      .select()
      .single();

    if (exErr) throw exErr;

    // Prepare Junction Data
    const roles: ("primary" | "secondary" | "stabilizer")[] = [
      "primary",
      "secondary",
      "stabilizer",
    ];

    const muscleLinks = roles.flatMap((role) => {
      const fieldName = `${role}Muscles` as keyof typeof formData;
      const muscleIds = formData[fieldName] as string[];
      return muscleIds.map((mId: string) => ({
        exercise_id: exerciseId,
        muscle_id: mId,
        role,
      }));
    });

    const equipmentLink = formData.equipmentId
      ? {
          exercise_id: exerciseId,
          equipment_id: formData.equipmentId,
        }
      : null;

    // 2. Save Junctions to Supabase
    const supabaseJunctions: Promise<any>[] = [];

    if (muscleLinks.length > 0) {
      supabaseJunctions.push(
        supabase.from("exercise_muscles").insert(muscleLinks),
      );
    }

    if (equipmentLink) {
      supabaseJunctions.push(
        supabase.from("exercise_equipment").insert([equipmentLink]),
      );
    }

    await Promise.all(supabaseJunctions);

    // 3. Sync to Local Dexie (using a transaction for data integrity)
    return await db.transaction(
      "rw",
      [db.exercises, db.exercise_equipment, db.exercise_muscles],
      async () => {
        await db.exercises.add(payload);

        if (equipmentLink) {
          await db.exercise_equipment.add(equipmentLink);
        }

        if (muscleLinks.length > 0) {
          await db.exercise_muscles.bulkAdd(muscleLinks);
        }

        return exerciseId;
      },
    );
  },

  // services/LibraryService.ts
  async getExerciseDetails(exerciseId: string) {
    const [ex, equipment, muscles, allMuscles] = await Promise.all([
      db.exercises.get(exerciseId),
      db.exercise_equipment.where("exercise_id").equals(exerciseId).first(),
      db.exercise_muscles.where("exercise_id").equals(exerciseId).toArray(),
      db.muscles.toArray(),
    ]);

    if (!ex) return null;

    const equipDef = await db.equipment.get(equipment?.equipment_id || "");
    const categoryDef = await db.muscles.get(ex.category || "");

    const mappedMuscles = muscles.map((em) => ({
      ...allMuscles.find((m) => m.id === em.muscle_id),
      role: em.role as "primary" | "secondary" | "stabilizer",
    }));

    return {
      ...ex,
      categoryName: categoryDef?.name || "General",
      equipmentName: equipDef?.name || "None",
      muscles: mappedMuscles,
    };
  },

  async deleteExercise(exerciseId: string) {
    return await db.transaction(
      "rw",
      [db.exercises, db.exercise_equipment, db.exercise_muscles],
      async () => {
        await db.exercises.delete(exerciseId);
        await db.exercise_equipment
          .where("exercise_id")
          .equals(exerciseId)
          .delete();
        await db.exercise_muscles
          .where("exercise_id")
          .equals(exerciseId)
          .delete();
      },
    );
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

  /**
   * Fetches all muscles from the DB that are top-level (orphans).
   */
  async getOrphanMuscles(): Promise<string[]> {
    try {
      const orphans = await db.muscles
        .filter((m) => {
          // If m.parent has ANY value (string, number, etc.), this returns false (removed)
          // If m.parent is null, undefined, or "", this returns true (kept)
          return !m.parent;
        })
        .toArray();

      return orphans.map((m) => m.name.toLowerCase());
    } catch (error) {
      console.error("Failed to fetch orphan muscles", error);
      return [];
    }
  },

  // services/LibraryService.ts
  async getExercisesForList() {
    const exercises = await db.exercises.toArray();
    const muscles = await db.muscles.toArray();
    const equipment = await db.equipment.toArray();
    const exEquipment = await db.exercise_equipment.toArray();

    return exercises.map((ex) => {
      const categoryMuscle = muscles.find((m) => m.id === ex.category);
      const exEquip = exEquipment.find((e) => e.exercise_id === ex.id);
      const equip = equipment.find((e) => e.id === exEquip?.equipment_id);

      return {
        id: ex.id,
        name: ex.name,
        category: ex.category,
        categoryName: categoryMuscle ? categoryMuscle.name : "General",
        equipmentName: equip ? equip.name : "Bodyweight",
      };
    });
  },

  async getExerciseForEdit(id: string) {
    const [ex, muscles, equipment] = await Promise.all([
      db.exercises.get(id),
      db.exercise_muscles.where("exercise_id").equals(id).toArray(),
      db.exercise_equipment.where("exercise_id").equals(id).first(),
    ]);

    if (!ex) return null;

    return {
      ...ex,
      equipmentId: equipment?.equipment_id?.toString() || "",
      primaryMuscles: muscles
        .filter((m) => m.role === "primary")
        .map((m) => m.muscle_id),
      secondaryMuscles: muscles
        .filter((m) => m.role === "secondary")
        .map((m) => m.muscle_id),
      stabilizerMuscles: muscles
        .filter((m) => m.role === "stabilizer")
        .map((m) => m.muscle_id),
      tracking: [
        ex.reps ? "reps" : null,
        ex.weight ? "weight" : null,
        ex.bodyweight ? "bodyweight" : null,
        ex.distance ? "distance" : null,
        ex.duration ? "duration" : null,
      ].filter(Boolean),
    };
  },

  async updateExercise(id: string, formData: any) {
    const has = (val: string) => (formData.tracking.includes(val) ? 1 : 0);
    const payload = {
      name: formData.name,
      category: formData.category,
      is_public: formData.isPublic ? 1 : 0,
      reps: has("reps"),
      weight: has("weight"),
      bodyweight: has("bodyweight"),
      distance: has("distance"),
      duration: has("duration"),
      updated_at: new Date().toISOString(),
    };

    // 1. Supabase Update
    const { error } = await supabase
      .from("exercises")
      .update(payload)
      .eq("id", id);
    if (error) throw error;

    // 2. Local Transaction
    return await db.transaction(
      "rw",
      [db.exercises, db.exercise_equipment, db.exercise_muscles],
      async () => {
        await db.exercises.update(id, payload);

        // Refresh Equipment
        await db.exercise_equipment.where("exercise_id").equals(id).delete();
        if (formData.equipmentId) {
          await db.exercise_equipment.add({
            exercise_id: id,
            equipment_id: parseInt(formData.equipmentId),
          });
        }

        // Refresh Muscles
        await db.exercise_muscles.where("exercise_id").equals(id).delete();
        const roles: ("primary" | "secondary" | "stabilizer")[] = [
          "primary",
          "secondary",
          "stabilizer",
        ];
        const links = roles.flatMap((role) =>
          formData[`${role}Muscles`].map((mId: string) => ({
            exercise_id: id,
            muscle_id: mId,
            role,
          })),
        );
        if (links.length > 0) await db.exercise_muscles.bulkAdd(links);
      },
    );
  },

  resetLock(): void {
    isLibrarySynced = false;
  },
};
