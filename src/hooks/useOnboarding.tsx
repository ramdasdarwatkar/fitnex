import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type {
  UserProfile,
  BodyMetrics,
  AthleteLevel,
  Database,
} from "../types/database.types";

type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];
type MetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];
type LevelInsert = Database["public"]["Tables"]["athlete_level"]["Insert"];

export const useOnboarding = () => {
  const saveOnboarding = async (
    profileData: UserProfile,
    currentWeight: number,
    height: number,
    selectedLevel: string,
    initialPoints: number,
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    // 1. Save User Profile
    const { data: profile, error: pError } = await supabase
      .from("user_profile")
      .upsert(profileData as ProfileInsert, { onConflict: "user_id" })
      .select()
      .single();

    if (pError || !profile) throw pError;

    // 2. Save Body Metrics
    const metrics: BodyMetrics = {
      user_id: profile.user_id,
      logdate: today,
      weight: currentWeight,
      height,
      created_at: now,
      updated_at: now,
    };

    const { error: mError } = await supabase
      .from("body_metrics")
      .upsert(metrics as MetricsInsert, { onConflict: "user_id,logdate" });

    if (mError) throw mError;

    // 3. Initialize Athlete Level
    const levelData: AthleteLevel = {
      user_id: profile.user_id,
      current_level: selectedLevel,
      level_points: initialPoints,
      updated_date: new Date().toISOString().split("T")[0],
    };

    const { error: lError } = await supabase
      .from("athlete_level")
      .upsert(levelData as LevelInsert, { onConflict: "user_id" });

    if (lError) throw lError;

    // 4. Atomic Dexie Cache Update
    await db.transaction(
      "rw",
      [db.user_profile, db.body_metrics, db.athlete_level],
      async () => {
        await db.user_profile.put(profile);
        await db.body_metrics.put(metrics);
        await db.athlete_level.put(levelData);
      },
    );

    return profile;
  };

  return { saveOnboarding };
};
