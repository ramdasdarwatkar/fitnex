import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../db/database";
import type { Workout, WorkoutLog } from "../types/database.types";

interface WorkoutContextType {
  activeWorkout: Workout | null;
  activeLogs: WorkoutLog[];
  isOngoing: boolean;
  startWorkout: (workout: Workout, logs: WorkoutLog[]) => Promise<void>;
  updateLog: (log: WorkoutLog) => Promise<void>;
  finishWorkout: (notes: string) => Promise<void>;
  discardWorkout: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeLogs, setActiveLogs] = useState<WorkoutLog[]>([]);

  // 1. Persistence: On mount, check Dexie for an unfinished live workout
  useEffect(() => {
    const resumeWorkout = async () => {
      const ongoing = await db.workouts.where("finish_time").equals("").first();
      if (ongoing) {
        const logs = await db.workout_logs
          .where("workout_id")
          .equals(ongoing.id)
          .toArray();
        setActiveWorkout(ongoing);
        setActiveLogs(logs);
      }
    };
    resumeWorkout();
  }, []);

  // 2. Start Logic: Insert into Dexie with is_synced: 0
  const startWorkout = async (workout: Workout, logs: WorkoutLog[]) => {
    const workoutData = { ...workout, is_synced: 0 };
    const logsData = logs.map((l) => ({ ...l, is_synced: 0 }));

    await db.workouts.put(workoutData);
    if (logsData.length > 0) await db.workout_logs.bulkPut(logsData);

    setActiveWorkout(workoutData);
    setActiveLogs(logsData);
  };

  // 3. Update Set: Update local cache as user completes sets
  const updateLog = async (log: WorkoutLog) => {
    const updatedLog = { ...log, is_synced: 0 };
    await db.workout_logs.put(updatedLog);
    setActiveLogs((prev) =>
      prev.map((l) => (l.id === log.id ? updatedLog : l)),
    );
  };

  // 4. Finish Logic: Prep for Sync (Actual Supabase push handled by a Sync Hook later)
  const finishWorkout = async (notes: string) => {
    if (!activeWorkout) return;

    const finishedWorkout = {
      ...activeWorkout,
      notes,
      finish_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.workouts.put(finishedWorkout);

    // Clear context so UI resets, but data stays in Dexie for Sync
    setActiveWorkout(null);
    setActiveLogs([]);
  };

  const discardWorkout = async () => {
    if (!activeWorkout) return;
    await db.workout_logs.where("workout_id").equals(activeWorkout.id).delete();
    await db.workouts.delete(activeWorkout.id);
    setActiveWorkout(null);
    setActiveLogs([]);
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        activeLogs,
        isOngoing: !!activeWorkout,
        startWorkout,
        updateLog,
        finishWorkout,
        discardWorkout,
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
