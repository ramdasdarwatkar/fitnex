import { createContext } from "react";
import type { AthleteSummary } from "../types/database.types";

export interface AuthContextType {
  user_id: string | null;
  athlete: AthleteSummary | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
