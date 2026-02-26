import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database, UserProfile } from "../types/database.types";
import { AthleteService } from "./AthleteService";

type ProfileRow = Database["public"]["Tables"]["user_profile"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];

export const UserProfileService = {
  /**
   * Updates or Creates the athlete profile
   */
  async updateProfile(payload: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("user_profile")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    await AthleteService.syncSummary(payload.user_id);

    return data;
  },

  /**
   * Saves the profile to Dexie and marks for sync.
   * Supabase Table: user_profile
   */
  async saveLocalProfile(profile: UserProfile) {
    return await db.user_profile.put({
      ...profile,
      is_synced: 0,
    });
  },

  /**
   * Helper to get the local profile
   */
  async getLocalProfile(user_id: string) {
    return await db.user_profile.get(user_id);
  },
};
