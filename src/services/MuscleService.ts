import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import type { Database, LocalMuscle, Muscle } from "../types/database.types";
import { v4 as uuidv4 } from "uuid";
import { DateUtils } from "../util/dateUtils";

// Extract Supabase-specific types to prevent "never" errors
type MuscleInsert = Database["public"]["Tables"]["muscles"]["Insert"];
type MuscleUpdate = Database["public"]["Tables"]["muscles"]["Update"];

export const MuscleService = {
  /**
   * READ METHODS (Dexie Only)
   */
  async getActiveMuscles(): Promise<LocalMuscle[]> {
    return await db.muscles.filter((m) => m.status !== false).toArray();
  },

  async getAllMuscles(): Promise<LocalMuscle[]> {
    return await db.muscles.toArray();
  },

  async getMuscleById(id: string): Promise<LocalMuscle | undefined> {
    return await db.muscles.get(id);
  },

  /**
   * Fetches all muscles from the DB that are top-level (orphans).
   */
  async getOrphanMuscles(): Promise<string[]> {
    try {
      const orphans = await db.muscles
        .filter((m) => {
          return !m.parent;
        })
        .toArray();

      return orphans.map((m) => m.name.toLowerCase());
    } catch (error) {
      console.error("Failed to fetch orphan muscles", error);
      return [];
    }
  },

  /**
   * WRITE METHODS (Local-First Sync Pattern)
   */
  async addMuscle(name: string, parentId: string | null): Promise<Muscle> {
    const id = uuidv4();
    const timestamp = DateUtils.getISTDate();

    // 1. Prepare Local Data
    const localData: LocalMuscle = {
      id,
      name,
      parent: parentId || null,
      status: true,
      updated_at: timestamp,
      is_synced: 0,
    };

    // 2. SAVE LOCAL FIRST
    await db.muscles.put(localData);

    // 3. Prepare Supabase Payload (Removing local-only fields)
    const supabasePayload: MuscleInsert = {
      id: localData.id,
      name: localData.name,
      parent: localData.parent,
      status: localData.status,
      updated_at: localData.updated_at,
    } as MuscleInsert;

    try {
      // 4. TRY SUPABASE
      const { data, error } = await supabase
        .from("muscles")
        .insert(supabasePayload)
        .select()
        .single();

      if (error) throw error;

      // 5. IF SUCCESS: Update local sync status
      await db.muscles.update(id, { is_synced: 1 });
      return data as Muscle;
    } catch (err) {
      // 6. IF FAIL: Log error only, remains is_synced: 0 locally
      console.error("Supabase Add Error (Offline Mode):", err);
      return localData as Muscle;
    }
  },

  async updateMuscle(
    id: string,
    name: string,
    parentId: string | null,
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // 1. UPDATE LOCAL FIRST
    await db.muscles.update(id, {
      name,
      parent: parentId || null,
      updated_at: timestamp,
      is_synced: 0,
    });

    // 2. Prepare Supabase Payload
    const payload: MuscleUpdate = {
      name,
      parent: parentId || null,
      updated_at: timestamp,
    } as MuscleUpdate;

    try {
      // 3. TRY SUPABASE
      const { error } = await supabase
        .from("muscles")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      // 4. IF SUCCESS: Update local sync status
      await db.muscles.update(id, { is_synced: 1 });
    } catch (err) {
      console.error("Supabase Update Error (Offline Mode):", err);
    }
  },

  async archiveMuscle(id: string): Promise<void> {
    // 1. UPDATE LOCAL FIRST
    await db.muscles.update(id, {
      status: false,
      is_synced: 0,
    });

    try {
      // 2. TRY SUPABASE
      const { error } = await supabase
        .from("muscles")
        .update({ status: false } as MuscleUpdate)
        .eq("id", id);

      if (error) throw error;

      // 3. IF SUCCESS: Update local sync status
      await db.muscles.update(id, { is_synced: 1 });
    } catch (err) {
      console.error("Supabase Archive Error (Offline Mode):", err);
    }
  },
};
