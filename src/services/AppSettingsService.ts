import { db } from "../db/database";
import type { LocalAppSettings } from "../types/database.types";

export const AppSettingsService = {
  async saveLocalAppSettings(userId: string) {
    const localRow: LocalAppSettings = {
      user_id: userId,
      theme: "light",
      accent_color: "emerald",
      is_synced: 0,
    };
    await db.app_settings.put(localRow);
  },
};
