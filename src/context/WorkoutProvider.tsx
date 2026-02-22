import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { WorkoutService } from "../services/WorkoutService";
import { WorkoutContext, type WorkoutContextType } from "./WorkoutTypes";
import type { LocalWorkoutLog } from "../types/database.types";

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  // 1. Real-time Dexie queries
  // useLiveQuery handles the subscription to the local DB automatically
  const activeWorkout = useLiveQuery(() =>
    WorkoutService.getActiveWorkoutQuery(),
  );

  const activeLogs = useLiveQuery(
    () =>
      activeWorkout ? WorkoutService.getWorkoutLogsQuery(activeWorkout.id) : [],
    [activeWorkout],
  );

  // 2. Stable navigation function
  const resumeSession = useCallback(
    (mode = "live") => {
      navigate(`/workout/active?mode=${mode}`);
    },
    [navigate],
  );

  // 3. Memoized state value
  // The generic <WorkoutContextType> ensures strict property validation
  const value = useMemo<WorkoutContextType>(
    () => ({
      activeWorkout: activeWorkout ?? null,
      activeLogs: (activeLogs ?? []) as LocalWorkoutLog[],
      isOngoing: !!activeWorkout,
      resumeSession,
    }),
    [activeWorkout, activeLogs, resumeSession],
  );

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};
