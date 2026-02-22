/* =========================
   ENUMS & CONSTANTS
========================= */

export type UserRole = "admin" | "user";
export type GenderType = "male" | "female" | "other";
export type MuscleRole = "primary" | "secondary" | "stabilizer";

// For Type-Safe Metric Selection in Progress Page
export type BodyMetricType =
  | "weight"
  | "height"
  | "belly"
  | "waist"
  | "hips"
  | "chest"
  | "shoulder"
  | "neck"
  | "biceps"
  | "forearms"
  | "calves"
  | "thighs";

/* =========================
   USER & ATHLETE
========================= */

export interface UserProfile {
  user_id: string;
  name: string;
  birthdate: string;
  target_weight: number;
  target_days_per_week: number;
  role: UserRole;
  gender: GenderType;
  created_at: string;
  updated_at: string | null;
}

export interface AthleteLevelsLookup {
  id: number;
  level_name: string;
  min_points: number;
  max_points: number | null;
  multiplier: number;
  is_senior: boolean;
  display_order: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface AthleteLevel {
  user_id: string;
  level_points: number;
  updated_date: string;
  current_level: string;
}

/* =========================
   BODY METRICS
========================= */

export interface BodyMetrics {
  user_id: string;
  logdate: string;
  weight: number;
  height: number;
  belly?: number | null;
  waist?: number | null;
  hips?: number | null;
  chest?: number | null;
  shoulder?: number | null;
  neck?: number | null;
  right_bicep?: number | null;
  left_bicep?: number | null;
  right_forearm?: number | null;
  left_forearm?: number | null;
  right_calf?: number | null;
  left_calf?: number | null;
  left_thigh?: number | null;
  right_thigh?: number | null;
  created_at: string;
  updated_at: string | null;
}

/* =========================
   EXERCISES & EQUIPMENT
========================= */

export interface Equipment {
  id: number;
  name: string;
  steps: boolean;
}

export interface Muscle {
  id: string;
  name: string;
  parent?: string | null;
  status: boolean;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  reps: boolean;
  weight: boolean;
  distance: boolean;
  duration: boolean;
  bodyweight: boolean;
  status: boolean;
  updated_at: string;
  added_by?: string | null;
  is_public: boolean;
  category: string;
}

export interface ExerciseMuscle {
  exercise_id: string;
  muscle_id: string;
  role: MuscleRole;
}

export interface ExerciseEquipment {
  exercise_id: string;
  equipment_id: number;
}

/* =========================
   WORKOUTS & ROUTINES
========================= */

export interface Routine {
  id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  status: boolean;
  updated_at: string;
  created_by: string;
}

export interface RoutineExercise {
  routine_id: string;
  exercise_id: string;
  exercise_order: number;
  target_sets?: number | null;
  target_reps?: number | null;
  target_distance?: number | null;
  target_duration?: number | null;
}

export interface Workout {
  id: string;
  user_id: string;
  routine_id?: string | null;
  notes?: string | null;
  status: boolean;
  rest_day: boolean;
  start_time: string;
  finish_time: string;
  created_at: string;
  updated_at: string | null;
}

export interface WorkoutLog {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  exercise_order: number;
  reps?: number | null;
  weight?: number | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface PersonalRecord {
  user_id: string;
  exercise_id: string;
  value: number;
  value_type: string;
  record_date: string;
  created_at: string;
}

/* =========================
   OFFLINE (DEXIE) EXTENSIONS
========================= */

export interface LocalUserProfile extends UserProfile {
  is_synced: number;
}

export interface LocalAthleteLevel extends AthleteLevel {
  is_synced: number;
}

export interface LocalBodyMetrics extends BodyMetrics {
  is_synced: number;
}

export interface LocalMuscle extends Muscle {
  is_synced: number;
}

export interface LocalExercise extends Exercise {
  is_synced: number;
}

export interface LocalExerciseEquipment extends ExerciseEquipment {
  is_synced: number;
}

export interface LocalExerciseMuscle extends ExerciseMuscle {
  is_synced: number;
}

export interface LocalRoutine extends Routine {
  is_synced: number;
}

export interface LocalRoutineExercise extends RoutineExercise {
  is_synced: number;
}

export interface LocalWorkout extends Workout {
  is_synced: number;
}

export interface LocalWorkoutLog extends WorkoutLog {
  is_synced: number;
}

/* =========================
   SQL VIEW INTERFACES
========================= */

/** v_user_dashboard */
export interface AthleteSummary {
  user_id: string;
  name: string;
  gender: GenderType;
  role: UserRole;
  birthdate: string;
  target_days_per_week: number;
  target_weight: number;
  current_weight: number;
  height: number;
  bmi: number | null;
  body_fat_percent: number | null;
  current_level: string | null;
  level_points: number | null;
  level_start: number | null;
  level_end: number | null;
  level_completion_percent: number | null;
  points_remaining: number | null;
  weight_lost: number | null;
  goal_completion_percent: number | null;
  estimated_goal_date: string | null;
  projected_next_level_date: string | null;
}

/** v_latest_personal_records */
export interface LatestPersonalRecord {
  user_id: string;
  exercise_id: string;
  value: number;
  value_type: string;
  record_date: string;
}

/** get_user_stats_between (RPC Function) */
export interface CustomizedStats {
  user_id: string;
  workout_sessions: number;
  total_sets: number;
  total_reps: number;
  total_volume: number;
  total_distance: number;
  total_duration_min: number;
  active_days: string[];
  rest_days: string[];
  total_steps: number;
  calories: number;
  muscle_names: string;
}

export interface LocalCustomizedStats extends CustomizedStats {
  start_date: string;
  end_date: string;
}

/* =========================
   SUPABASE DATABASE TYPE
========================= */

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: UserProfile;
        Insert: UserProfile;
        Update: Partial<UserProfile>;
      };
      body_metrics: {
        Row: BodyMetrics;
        Insert: BodyMetrics;
        Update: Partial<BodyMetrics>;
      };
      athlete_levels_lookup: {
        Row: AthleteLevelsLookup;
        Insert: AthleteLevelsLookup;
        Update: Partial<AthleteLevelsLookup>;
      };
      athlete_level: {
        Row: AthleteLevel;
        Insert: AthleteLevel;
        Update: Partial<AthleteLevel>;
      };
      equipment: {
        Row: Equipment;
        Insert: Equipment;
        Update: Partial<Equipment>;
      };
      muscles: { Row: Muscle; Insert: Muscle; Update: Partial<Muscle> };
      exercises: { Row: Exercise; Insert: Exercise; Update: Partial<Exercise> };
      exercise_muscles: {
        Row: ExerciseMuscle;
        Insert: ExerciseMuscle;
        Update: Partial<ExerciseMuscle>;
      };
      exercise_equipment: {
        Row: ExerciseEquipment;
        Insert: ExerciseEquipment;
        Update: Partial<ExerciseEquipment>;
      };
      routines: { Row: Routine; Insert: Routine; Update: Partial<Routine> };
      routine_exercises: {
        Row: RoutineExercise;
        Insert: RoutineExercise;
        Update: Partial<RoutineExercise>;
      };
      personal_record: {
        Row: PersonalRecord;
        Insert: PersonalRecord;
        Update: Partial<PersonalRecord>;
      };
      workouts: { Row: Workout; Insert: Workout; Update: Partial<Workout> };
      workout_logs: {
        Row: WorkoutLog;
        Insert: WorkoutLog;
        Update: Partial<WorkoutLog>;
      };
    };
    Views: {
      v_user_dashboard: { Row: AthleteSummary };
      v_latest_body_metrics: { Row: BodyMetrics };
      v_latest_personal_records: { Row: LatestPersonalRecord };
    };
    Functions: {
      get_user_stats_between: {
        Args: { p_start: string; p_end: string };
        Returns: CustomizedStats;
      };
    };
  };
}
