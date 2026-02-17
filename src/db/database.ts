import Dexie, { type Table } from "dexie";
import type {
  AthleteSummary,
  Muscle,
  Equipment,
  Exercise,
  ExerciseMuscle,
  ExerciseEquipment,
  Routine,
  RoutineExercise,
  PersonalRecord,
  AthleteLevelsLookup,
  LocalWorkoutLog,
  LocalWorkout,
} from "../types/database.types";

export interface AppSettings {
  id: string; // "global"
  theme: "dark" | "light";
  brandColor: string;
  unitSystem: "metric" | "imperial";
}

export class FitnexDB extends Dexie {
  athlete_summary!: Table<AthleteSummary, string>;
  app_settings!: Table<AppSettings, string>;
  athlete_levels_lookup!: Table<AthleteLevelsLookup, number>;
  personal_records!: Table<PersonalRecord, [string, string]>;

  muscles!: Table<Muscle, string>;
  equipment!: Table<Equipment, number>;
  exercises!: Table<Exercise, string>;
  exercise_muscles!: Table<ExerciseMuscle, [string, string]>;
  exercise_equipment!: Table<ExerciseEquipment, [string, number]>;
  routines!: Table<Routine, string>;
  routine_exercises!: Table<RoutineExercise, [string, string]>;

  workouts!: Table<LocalWorkout, string>;
  workout_logs!: Table<LocalWorkoutLog, string>;

  constructor() {
    super("FitnexDB");
    // Version bumped to 2 to handle the schema change
    this.version(2).stores({
      athlete_summary: "user_id",
      app_settings: "id",
      athlete_levels_lookup: "id, level_name",
      personal_records: "[user_id+exercise_id]",
      muscles: "id, name, parent",
      equipment: "id, name",
      exercises: "id, name",
      exercise_muscles: "[exercise_id+muscle_id], muscle_id",
      exercise_equipment: "[exercise_id+equipment_id], equipment_id",
      routines: "id, name",
      routine_exercises: "[routine_id+exercise_id], exercise_id",
      workouts: "id, user_id, start_time, status, is_synced",
      workout_logs:
        "id, workout_id, exercise_id, is_synced, [workout_id+exercise_id+set_number]",
    });
  }
}

export const db = new FitnexDB();
