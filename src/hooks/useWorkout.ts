import { useContext } from "react";
import { WorkoutContext } from "../context/WorkoutTypes";

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within WorkoutProvider");
  }
  return context;
};
