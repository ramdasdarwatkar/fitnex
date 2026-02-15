import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];

export const UserProfileService = {
  async updateProfile(data: ProfileInsert) {
    return await supabase.from("user_profile").upsert(data);
  },
};
