import { createContext } from "react";
import type { LocalWorkout, LocalWorkoutLog } from "../types/database.types";

export interface WorkoutContextType {
  activeWorkout: LocalWorkout | null;
  activeLogs: LocalWorkoutLog[];
  isOngoing: boolean;
  resumeSession: (mode?: string) => void;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(
  undefined,
);
