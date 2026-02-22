import Dexie, { type Table } from "dexie";
import type {
  AthleteSummary,
  Equipment,
  PersonalRecord,
  AthleteLevelsLookup,
  LocalWorkoutLog,
  LocalWorkout,
  LatestPersonalRecord,
  LocalCustomizedStats,
  Workout,
  LocalBodyMetrics,
  LocalMuscle,
  LocalExercise,
  LocalExerciseMuscle,
  LocalExerciseEquipment,
  LocalRoutine,
  LocalRoutineExercise,
  LocalUserProfile,
  LocalAthleteLevel, // Added for local caching
} from "../types/database.types"; // Points to your consolidated types file

export interface AppSettings {
  id: string; // "global"
  theme: "dark" | "light";
  brandColor: string;
  unitSystem: "metric" | "imperial";
}

export class FitnexDB extends Dexie {
  athlete_summary!: Table<AthleteSummary, string>;
  latest_personal_record!: Table<LatestPersonalRecord, string>;
  app_settings!: Table<AppSettings, string>;
  athlete_levels_lookup!: Table<AthleteLevelsLookup, number>;
  athlete_level!: Table<LocalAthleteLevel, [string, string]>;
  personal_records!: Table<PersonalRecord, [string, string]>;
  user_profile!: Table<LocalUserProfile, string>;
  // 🆕 NEW: Added for Progress Page caching
  body_metrics!: Table<LocalBodyMetrics, [string, string]>;

  muscles!: Table<LocalMuscle, string>;
  equipment!: Table<Equipment, number>;
  exercises!: Table<LocalExercise, string>;
  exercise_muscles!: Table<LocalExerciseMuscle, [string, string]>;
  exercise_equipment!: Table<LocalExerciseEquipment, [string, number]>;
  routines!: Table<LocalRoutine, string>;
  routine_exercises!: Table<LocalRoutineExercise, [string, string]>;

  workouts!: Table<LocalWorkout, string>;
  workout_logs!: Table<LocalWorkoutLog, string>;
  customized_stats!: Table<LocalCustomizedStats, string>;
  workout_history!: Table<Workout, string>;

  constructor() {
    super("FitnexDB");

    // Bumped to version 4 to include body_metrics and enhanced sync indexing
    this.version(1).stores({
      athlete_summary: "user_id",
      user_profile: "user_id",
      latest_personal_record: "exercise_id",
      customized_stats:
        "[user_id+start_date+end_date], user_id, start_date, end_date",
      app_settings: "id",
      athlete_levels_lookup: "id, level_name",
      personal_records: "[user_id+exercise_id]",

      // 🆕 NEW: body_metrics store
      // Primary key is composite [user_id+logdate] to match Supabase
      body_metrics: "[user_id+logdate], user_id, logdate, is_synced",

      muscles: "id, name, parent",
      equipment: "id, name",
      exercises: "id, name",
      athlete_level: "[user_id+updated_date]",
      exercise_muscles: "[exercise_id+muscle_id], muscle_id",
      exercise_equipment: "[exercise_id+equipment_id], equipment_id",
      routines: "id, name",
      routine_exercises: "[routine_id+exercise_id], exercise_id",

      workouts: "id, user_id, start_time, status, is_synced",
      workout_logs:
        "id, workout_id, exercise_id, exercise_order, is_synced, [workout_id+exercise_id+set_number]",
      workout_history: "id, user_id, start_time",
    });
  }
}

export const db = new FitnexDB();
