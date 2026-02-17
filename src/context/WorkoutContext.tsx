import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { WorkoutService } from "../services/WorkoutService";
import type { Workout, WorkoutLog } from "../types/database.types";

interface WorkoutContextType {
  activeWorkout: Workout | null;
  activeLogs: WorkoutLog[];
  isOngoing: boolean;
  resumeSession: (mode?: string) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const activeWorkout = useLiveQuery(() =>
    WorkoutService.getActiveWorkoutQuery(),
  );
  const activeLogs = useLiveQuery(
    () =>
      activeWorkout ? WorkoutService.getWorkoutLogsQuery(activeWorkout.id) : [],
    [activeWorkout],
  );

  const resumeSession = (mode = "live") => {
    navigate(`/workout/active?mode=${mode}`);
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout: activeWorkout || null,
        activeLogs: activeLogs || [],
        isOngoing: !!activeWorkout,
        resumeSession,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context)
    throw new Error("useWorkout must be used within WorkoutProvider");
  return context;
};
