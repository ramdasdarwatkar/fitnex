import { db } from "../db/database";
import type { Equipment } from "../types/database.types";

export const EquipmentService = {
  async getAllEquipments(): Promise<Equipment[]> {
    return await db.equipment.toArray();
  },
};
