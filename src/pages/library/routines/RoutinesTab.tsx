import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RoutineService,
  type EnrichedRoutine,
} from "../../../services/RoutineService";
import { WorkoutService } from "../../../services/WorkoutService";
import { Play, ClipboardList, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useWorkout } from "../../../hooks/useWorkout";

interface RoutinesTabProps {
  search: string;
}

export const RoutinesTab = ({ search }: RoutinesTabProps) => {
  const navigate = useNavigate();
  const { user_id } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();

  const [routines, setRoutines] = useState<EnrichedRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user_id) {
      RoutineService.getRoutinesWithMeta().then((data) => {
        if (isMounted) {
          setRoutines(data);
          setLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user_id]);

  const handleStartRoutine = async (routine: EnrichedRoutine) => {
    if (!user_id) return;

    if (isOngoing) {
      resumeSession();
      return;
    }

    const exercises = routine.exercises || [];
    if (exercises.length === 0) {
      alert("This routine has no exercises. Please add some before starting.");
      return;
    }

    const logs = exercises.map((ex, idx) => ({
      exercise_id: ex.exercise_id,
      reps: ex.target_reps || 10,
      weight: 0,
      set_number: 1,
      exercise_order: ex.exercise_order ?? idx,
    }));

    try {
      await WorkoutService.startNewWorkout(user_id, routine.id, logs);
      resumeSession();
    } catch (error: unknown) {
      console.error("Failed to start workout:", error);
      alert("Could not start workout session.");
    }
  };

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {filtered.length === 0 ? (
        <div className="text-center py-20 opacity-30">
          <ClipboardList size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            No Routines Found
          </p>
        </div>
      ) : (
        filtered.map((route) => (
          <div
            key={route.id}
            className="bg-bg-surface border border-border-color rounded-xl p-6 space-y-5 shadow-xl transition-all hover:border-border-color-hover"
          >
            {/* Routine Header */}
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => navigate(`/library/routines/${route.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Icon Box: Matches ExerciseTab icon rounding */}
                <div className="w-12 h-12 rounded-[1.4rem] bg-bg-main flex items-center justify-center text-brand-primary border border-border-color group-hover:border-brand-primary/30 transition-all">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 className="text-[13px] font-black uppercase italic text-text-main leading-none group-hover:text-brand-primary transition-colors">
                    {route.name}
                  </h3>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1.5">
                    {route.exercise_count} Exercises
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-text-muted opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </div>

            {/* Tags: Matches ExerciseTab tag style */}
            <div className="flex flex-wrap gap-2">
              {route.muscles.length > 0 ? (
                route.muscles.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 bg-bg-main border border-border-color rounded-lg text-[7px] font-black uppercase text-text-muted"
                  >
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-[7px] font-black uppercase text-text-muted opacity-30 italic">
                  No focus data
                </span>
              )}
            </div>

            {/* Action Button: Strictly rounded-[1.4rem] and font-black italic */}
            <button
              onClick={() => handleStartRoutine(route)}
              className={`w-full py-5 rounded-[1.4rem] flex items-center justify-center gap-2 transition-all font-black uppercase italic text-[11px] tracking-widest active:scale-95 shadow-lg ${
                isOngoing
                  ? "bg-bg-main text-text-muted border border-border-color cursor-not-allowed opacity-50"
                  : "bg-brand-primary text-bg-main shadow-brand-primary/20"
              }`}
            >
              <Play size={14} fill="currentColor" />
              {isOngoing ? "Session in progress" : "Start Routine"}
            </button>
          </div>
        ))
      )}
    </div>
  );
};
