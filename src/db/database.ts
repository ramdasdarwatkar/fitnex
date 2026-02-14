import Dexie, { type Table } from "dexie";
import type {
  UserProfile,
  BodyMetrics,
  AthleteLevelsLookup,
  AthleteLevel,
  Equipment,
  Muscle,
  Exercise,
  ExerciseMuscle,
  ExerciseEquipment,
  Routine,
  RoutineExercise,
  PersonalRecord,
  Workout,
  WorkoutLog,
  AthleteProgress,
} from "../types/database.types";

export class TrackFitDB extends Dexie {
  user_profile!: Table<UserProfile, string>;
  body_metrics!: Table<BodyMetrics, [string, string]>;
  athlete_levels_lookup!: Table<AthleteLevelsLookup, number>;
  athlete_level!: Table<AthleteLevel, string>;
  equipment!: Table<Equipment, number>;
  muscles!: Table<Muscle, string>;
  exercises!: Table<Exercise, string>;
  exercise_muscles!: Table<ExerciseMuscle, [string, string]>;
  exercise_equipment!: Table<ExerciseEquipment, [string, number]>;
  routines!: Table<Routine, string>;
  routine_exercises!: Table<RoutineExercise, [string, string]>;
  personal_record!: Table<PersonalRecord, [string, string, string]>;
  workouts!: Table<Workout, string>;
  workout_logs!: Table<WorkoutLog, string>;
  athlete_progress!: Table<AthleteProgress, string>;

  constructor() {
    super("TrackFitDB");

    this.version(1).stores({
      /* USER */
      user_profile: "user_id, role",

      /* BODY METRICS */
      body_metrics: "[user_id+logdate], user_id, logdate",

      /* ATHLETE LEVELS */
      athlete_levels_lookup: "id, &level_name",
      athlete_level: "user_id",

      /* LOOKUPS */
      equipment: "id, &name",
      muscles: "id, name, parent",

      /* EXERCISES */
      exercises: "id, name, added_by",
      exercise_muscles: "[exercise_id+muscle_id], muscle_id",
      exercise_equipment: "[exercise_id+equipment_id], equipment_id",

      /* ROUTINES */
      routines: "id, name, created_by",
      routine_exercises: "[routine_id+exercise_id], exercise_id",

      /* PERSONAL RECORDS */
      personal_record:
        "[user_id+exercise_id+record_date], user_id, exercise_id",

      /* WORKOUTS */
      workouts: "id, user_id, routine_id, start_time",

      /* WORKOUT LOGS */
      workout_logs:
        "id, workout_id, exercise_id, set_number, [workout_id+exercise_id+set_number]",

      athlete_progress:
        "user_id, current_level, level_points, level_completion_percent, points_remaining, avg_weekly_gain, estimated_weeks_to_next_level",
    });
  }
}

export const db = new TrackFitDB();
