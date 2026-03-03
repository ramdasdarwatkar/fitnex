import { db } from "../db/database";
import { supabase } from "../lib/supabase";
import { DateUtils } from "../util/dateUtils";

export const PersonalRecordService = {
  async checkPR(userId: string, exerciseId: string, weight: number) {
    const existingPR = await db.personal_records.get([userId, exerciseId]);

    if (!existingPR || weight > existingPR.value) {
      const now = DateUtils.getISTDate();
      const newPR = {
        user_id: userId,
        exercise_id: exerciseId,
        value: weight,
        value_type: "weight",
        record_date: now,
        created_at: DateUtils.getISTDate(),
      };
      await db.personal_records.put(newPR);
      return true;
    }
    return false;
  },

  async getExercisePRs(userId: string, exerciseId: string) {
    const { data, error } = await supabase
      .from("personal_record")
      .select("value, record_date, value_type")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .order("record_date", { ascending: true });

    if (error) throw error;
    return data;
  },
};
