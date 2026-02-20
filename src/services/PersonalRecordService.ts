import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import { DateUtils } from "../util/dateUtils";

let isPersonalRecordSynced = false;

export const PersonalRecordService = {
  async syncPRs(userId: string) {
    const { data, error } = await supabase
      .from("v_latest_personal_records")
      .select("*")
      .eq("user_id", userId);

    if (error) return;
    if (data) {
      await db.transaction("rw", db.latest_personal_record, async () => {
        await db.latest_personal_record.clear();
        await db.latest_personal_record.bulkPut(data);
      });
    }
    isPersonalRecordSynced = true;
  },

  async checkPR(userId: string, exerciseId: string, weight: number) {
    const existingPR = await db.latest_personal_record.get(exerciseId);
    if (!existingPR || weight > existingPR.value) {
      const now = DateUtils.getISTDate();
      const newPR = {
        user_id: userId,
        exercise_id: exerciseId,
        value: weight,
        record_date: now,
      };
      await db.latest_personal_record.put(newPR);
      await supabase.from("personal_record").insert(newPR);
      return true;
    }
    return false;
  },

  async getExercisePRs(userId: string, exerciseId: string) {
    const { data, error } = await supabase
      .from("personal_record")
      .select("value, record_date")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .order("record_date", { ascending: true });

    if (error) throw error;
    return data;
  },

  resetLock() {
    isPersonalRecordSynced = false;
  },
};
