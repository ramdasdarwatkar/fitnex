import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type LevelInsert = Database["public"]["Tables"]["athlete_level"]["Insert"];

export const AthleteLevelService = {
  async updateLevel(data: LevelInsert) {
    return await supabase.from("athlete_level").upsert(data);
  },
};
