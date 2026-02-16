import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type ProfileRow = Database["public"]["Tables"]["user_profile"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];

export const UserProfileService = {
  /**
   * Fetches the full profile for a specific user
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      return null;
    }
    return data;
  },

  /**
   * Updates or Creates the athlete profile
   */
  async updateProfile(payload: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("user_profile")
      .upsert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return data;
  },
};
