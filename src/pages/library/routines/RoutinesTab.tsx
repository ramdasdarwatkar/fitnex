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
        <Loader2 className="animate-spin text-brand-primary/50" size={30} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-32">
      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-text-muted/20">
          <ClipboardList size={44} strokeWidth={1} className="mb-4" />
          <p className="text-[10px] font-black uppercase italic tracking-[0.4em]">
            No routines found
          </p>
        </div>
      )}

      {filtered.map((route) => (
        <div
          key={route.id}
          className="bg-bg-surface border border-border-color/40 rounded-2xl p-5 space-y-5
                     card-glow transition-all active:scale-[0.98]"
        >
          {/* Header — tappable, navigates to detail */}
          <div
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => navigate(`/library/routines/${route.id}`)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-11 h-11 rounded-xl bg-bg-main flex items-center justify-center
                           text-brand-primary border border-border-color/40
                           group-hover:border-brand-primary/40 transition-colors shrink-0"
              >
                <ClipboardList size={20} />
              </div>

              <div className="text-left min-w-0">
                <h3
                  className="text-[13px] font-black uppercase italic text-text-main
                               leading-none group-hover:text-brand-primary transition-colors
                               tracking-tight truncate"
                >
                  {route.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"
                    style={{ boxShadow: "0 0 5px var(--glow-primary)" }}
                  />
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-text-muted/60">
                    {route.exercise_count} exercise
                    {route.exercise_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-bg-main
                            border border-border-color/40 shrink-0 ml-3
                            group-hover:border-brand-primary/40 group-hover:text-brand-primary
                            transition-colors"
            >
              <ChevronRight
                size={16}
                className="text-text-muted/40 group-hover:text-brand-primary"
              />
            </div>
          </div>

          {/* Muscle tags */}
          {route.muscles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {route.muscles.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 bg-bg-main border border-border-color/40 rounded-lg
                             text-[8px] font-black uppercase italic text-text-muted/60
                             tracking-wider"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[8px] font-black uppercase text-text-muted/20 italic tracking-widest">
              No muscle groups tagged
            </p>
          )}

          {/* Start button */}
          <button
            onClick={() => handleStartRoutine(route)}
            disabled={isOngoing}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2.5
                        transition-all font-black uppercase italic text-[11px]
                        tracking-[0.25em] active:scale-[0.97]
                        ${
                          isOngoing
                            ? "bg-bg-main text-text-muted/40 border border-border-color/20"
                            : "bg-brand-primary"
                        }`}
            style={
              !isOngoing
                ? {
                    color: "var(--color-on-brand)",
                    boxShadow: "0 4px 20px var(--glow-primary)",
                  }
                : undefined
            }
          >
            {!isOngoing && (
              <Play size={13} fill="currentColor" className="animate-pulse" />
            )}
            <span>{isOngoing ? "Active Session" : "Start Session"}</span>
          </button>
        </div>
      ))}
    </div>
  );
};
