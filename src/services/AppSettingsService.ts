import { db } from "../db/database";
import type { LocalAppSettings } from "../types/database.types";
import { applySettingsToDOM } from "../util/themeUtils";

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

  async updateLocalAppSettings(
    userId: string,
    theme: "dark" | "light" | "system",
    accent_color: string,
  ) {
    const localRow: LocalAppSettings = {
      user_id: userId,
      theme,
      accent_color,
      is_synced: 0,
    };
    await db.app_settings.put(localRow);
    applySettingsToDOM(localRow);
  },
};
