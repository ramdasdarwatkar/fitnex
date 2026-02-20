/* =========================
   ENUMS
========================= */

export type UserRole = "admin" | "user";
export type GenderType = "male" | "female" | "other";
export type MuscleRole = "primary" | "secondary" | "stabilizer";

/* =========================
   USER
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
   ATHLETE LEVELS
========================= */

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
   LOOKUPS
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

/* =========================
   EXERCISES
========================= */

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
   ROUTINES
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

/* =========================
   PERSONAL RECORDS
========================= */

export interface PersonalRecord {
  user_id: string;
  exercise_id: string;
  value: number;
  record_date: string;
  created_at: string;
}

/* =========================
   WORKOUTS
========================= */

export interface Workout {
  id: string;
  user_id: string;
  routine_id?: string | null;
  notes?: string | null;
  status: boolean; // Supabase Boolean
  rest_day: boolean; // Supabase Boolean
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
  exercise_order: number; // Standardized sorting field
  reps?: number | null;
  weight?: number | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
  updated_at: string | null;
}

// Extend for local Dexie use
export interface LocalWorkoutLog extends Omit<WorkoutLog, "completed"> {
  completed: number; // 1 or 0 for Dexie indexing
  is_synced: number; // 1 or 0 for Dexie indexing
}

export interface LocalWorkout extends Omit<Workout, "status" | "rest_day"> {
  status: number; // 1 (active) or 0 (finished)
  rest_day: number; // 1 or 0
  is_synced: number; // 1 or 0
}

/* =========================
   Athlete Summary
========================= */

export interface AthleteSummary {
  user_id: string;
  name: string;

  gender: "male" | "female" | "other";
  role: "admin" | "user";
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

  // 🆕 NEW
  projected_next_level_date: string | null;
}

export interface LatestPersonalRecord {
  user_id: string;
  exercise_id: string;
  value: number;
  record_date: string; // ISO date
}

// types/weeklyStats.ts
export interface CustomizedStats {
  user_id: string;
  total_sets: number;
  workout_sessions: number;
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

      muscles: {
        Row: Muscle;
        Insert: Muscle;
        Update: Partial<Muscle>;
      };

      exercises: {
        Row: Exercise;
        Insert: Exercise;
        Update: Partial<Exercise>;
      };

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

      routines: {
        Row: Routine;
        Insert: Routine;
        Update: Partial<Routine>;
      };

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

      workouts: {
        Row: Workout;
        Insert: Workout;
        Update: Partial<Workout>;
      };

      workout_logs: {
        Row: WorkoutLog;
        Insert: WorkoutLog;
        Update: Partial<WorkoutLog>;
      };
    };
    Views: {
      v_user_dashboard: {
        Row: AthleteSummary;
      };
      v_latest_body_metrics: {
        Row: BodyMetrics;
      };
      v_latest_personal_records: {
        Row: LatestPersonalRecord;
      };
    };
    Functions: {
      get_user_stats_between: {
        Args: {
          p_start: string;
          p_end: string;
        };
        Returns: CustomizedStats;
      };
    };
  };
}
