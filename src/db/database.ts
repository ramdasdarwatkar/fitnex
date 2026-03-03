import Dexie, { type Table } from "dexie";
import type {
  AthleteSummary,
  Equipment,
  PersonalRecord,
  AthleteLevelsLookup,
  LocalWorkoutLog,
  LocalWorkout,
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
  LocalAthleteLevel,
  LocalAppSettings, // Added for local caching
} from "../types/database.types"; // Points to your consolidated types file

export class FitnexDB extends Dexie {
  athlete_summary!: Table<AthleteSummary, string>;
  app_settings!: Table<LocalAppSettings, string>;
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
      user_profile: "user_id, is_synced",
      customized_stats:
        "[user_id+start_date+end_date], user_id, start_date, end_date",
      app_settings: "user_id,is_synced",
      athlete_levels_lookup: "id, level_name",
      personal_records:
        "[user_id+exercise_id+value_type+record_date],exercise_id,is_synced",

      // 🆕 NEW: body_metrics store
      // Primary key is composite [user_id+logdate] to match Supabase
      body_metrics: "[user_id+logdate], user_id, logdate, is_synced",

      muscles: "id, name, parent,is_synced",
      equipment: "id, name",
      exercises: "id, name,is_synced",
      athlete_level: "[user_id+updated_date],is_synced",
      exercise_muscles: "[exercise_id+muscle_id], muscle_id,is_synced",
      exercise_equipment: "[exercise_id+equipment_id], equipment_id,is_synced",
      routines: "id, name,is_synced",
      routine_exercises: "[routine_id+exercise_id], exercise_id,is_synced",

      workouts: "id, user_id, start_time, status, is_synced",
      workout_logs:
        "id, workout_id, exercise_id, exercise_order, is_synced, [workout_id+exercise_id+set_number]",
      workout_history: "id, user_id, start_time",
    });
  }
}

export const db = new FitnexDB();
