import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type {
  Exercise,
  LocalExercise,
  LocalExerciseEquipment,
  LocalExerciseMuscle,
} from "../types/database.types";
import { EquipmentService } from "./EquipmentService";
import { MuscleService } from "./MuscleService";
import { v4 as uuidv4 } from "uuid";

export interface EnrichedExercise extends LocalExercise {
  all_muscles: {
    name: string;
    parent_name: string | null;
    role: "primary" | "secondary" | "stabilizer";
  }[];
  equipment_name: string;
}

export const ExerciseService = {
  async getAllExercises(): Promise<LocalExercise[]> {
    return await db.exercises.toArray();
  },

  async getAllExerciseMuscles(): Promise<LocalExerciseMuscle[]> {
    return await db.exercise_muscles.toArray();
  },

  async getAllExerciseEquipment(): Promise<LocalExerciseEquipment[]> {
    return await db.exercise_equipment.toArray();
  },

  async getAllActiveExercises(): Promise<LocalExercise[]> {
    return await db.exercises.filter((ex) => ex.status !== false).toArray();
  },

  async getExercisesWithMeta(): Promise<EnrichedExercise[]> {
    const [exercises, exMuscles, exEquip, muscles, equipment] =
      await Promise.all([
        this.getAllActiveExercises(),
        this.getAllExerciseMuscles(),
        this.getAllExerciseEquipment(),
        MuscleService.getAllMuscles(),
        EquipmentService.getAllEquipments(),
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

  async getExercisesForList() {
    const exercises = await db.exercises
      .filter((e) => e.status !== false)
      .toArray();
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

  async saveExercise(formData: any, userId: string) {
    const exerciseId = uuidv4();

    // Helper to map tracking metrics to boolean values
    const hasMetric = (val: string) => formData.tracking.includes(val);

    const payload = {
      id: exerciseId,
      added_by: userId,
      name: formData.name.trim(),
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
    const { error: exErr } = await supabase.from("exercises").insert([payload]);

    if (exErr) throw exErr;

    // 2. Prepare Junction Data
    const roles: ("primary" | "secondary" | "stabilizer")[] = [
      "primary",
      "secondary",
      "stabilizer",
    ];

    const muscleLinks = roles.flatMap((role) => {
      const fieldName = `${role}Muscles` as keyof typeof formData;
      const muscleIds = (formData[fieldName] as string[]) || [];
      return muscleIds.map((mId: string) => ({
        exercise_id: exerciseId,
        muscle_id: mId,
        role,
      }));
    });

    /**
     * THE ONE-PLACE FIX:
     * Explicitly cast equipmentId to Number to satisfy int2 requirement.
     * We check for truthiness to avoid sending 0 or NaN if nothing is selected.
     */
    const equipmentLink = formData.equipmentId
      ? {
          exercise_id: exerciseId,
          equipment_id: Number(formData.equipmentId),
        }
      : null;

    // 3. Save Junctions to Supabase
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

    /**
     * 4. SYNC TO LOCAL DEXIE
     * Using a transaction to ensure atomic local updates.
     * The numeric equipment_id ensures your .find() logic works on refresh.
     */
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

  async getExerciseById(exerciseId: string) {
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
    const has = (val: string) => formData.tracking.includes(val);
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
};
