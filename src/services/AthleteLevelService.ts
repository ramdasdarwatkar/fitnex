import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { AthleteLevel, Database } from "../types/database.types";

/**
 * STRICT TYPES
 * Row: For reading from/writing to Dexie cache
 * Insert: For updating the athlete's progress in Supabase
 */
type LevelLookup = Database["public"]["Tables"]["athlete_levels_lookup"]["Row"];
type LevelInsert = Database["public"]["Tables"]["athlete_level"]["Insert"];

// Session Lock to prevent redundant metadata fetches
let isMetadataSynced = false;

export const AthleteLevelService = {
  /**
   * 1. SYNC METADATA (Used by CacheDataLoader)
   * Fetches the rank definitions (e.g., Starter, Novice, Warrior)
   * only if they aren't already in the session or local cache.
   */
  async syncMetadata(force = false) {
    if (isMetadataSynced && !force) return;

    // Check Dexie count to see if we have metadata from a previous session
    const count = await db.athlete_levels_lookup.count();
    if (count > 0 && !force) {
      isMetadataSynced = true;
      return;
    }

    // Cache Miss: Fetch rank definitions ordered by the display_order
    const { data, error } = await supabase
      .from("athlete_levels_lookup")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Metadata sync error:", error);
      return;
    }

    if (data) {
      await db.athlete_levels_lookup.bulkPut(data as LevelLookup[]);
      isMetadataSynced = true;
    }
  },

  /**
   * 2. UPDATE LEVEL
   * Persists the athlete's current level/points progress to Supabase.
   */
  async updateLevel(data: LevelInsert) {
    const response = await supabase.from("athlete_level").upsert(data);

    // Note: If you have a local athlete_level table in Dexie,
    // you would update it here after a successful upsert.

    return response;
  },

  /**
   * 3. RESET LOCK
   * Call this during signOut to ensure the next user triggers a fresh sync.
   */
  resetLock() {
    isMetadataSynced = false;
  },

  /**
   * Saves the initial or updated level state to Dexie.
   */
  async saveLocalLevel(level: AthleteLevel) {
    return await db.athlete_level.put({
      ...level,
      is_synced: 0,
    });
  },

  /**
   * Retrieves the current level metadata from the lookup table.
   */
  async getLevelMetadata(levelName: string) {
    return await db.athlete_levels_lookup
      .where("level_name")
      .equals(levelName)
      .first();
  },
};
