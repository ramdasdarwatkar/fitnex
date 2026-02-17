import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RoutineService,
  type EnrichedRoutine,
} from "../../../services/RoutineService";
import { useWorkout } from "../../../context/WorkoutContext";
import { useAuth } from "../../../context/AuthContext";
import { Play, ClipboardList, ChevronRight } from "lucide-react";

export const RoutinesTab = ({ search }: { search: string }) => {
  const navigate = useNavigate();
  const { user_id } = useAuth();
  const { isOngoing, startWorkout, resumeSession } = useWorkout();
  const [routines, setRoutines] = useState<EnrichedRoutine[]>([]);

  useEffect(() => {
    if (user_id) RoutineService.getRoutinesWithMeta().then(setRoutines);
  }, [user_id]);

  const handleStartRoutine = async (routine: EnrichedRoutine) => {
    if (!user_id) return;
    if (isOngoing) return resumeSession();

    // Mapping routine exercises to the format the context expects
    const logs = routine.exercises.map((ex: any) => ({
      exercise_id: ex.exercise_id,
      reps: ex.target_reps || 10,
      weight: null,
      set_number: 1,
    }));

    await startWorkout(user_id, routine.id, logs as any);
  };

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col gap-4">
      {filtered.map((route) => (
        <div
          key={route.id}
          className="bg-slate-900 border border-slate-800 rounded-[2.2rem] p-6 space-y-5 shadow-xl"
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => navigate(`/library/routines/${route.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[var(--brand-primary)]">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase italic text-white leading-none">
                  {route.name}
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                  {route.exercise_count} Exercises
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="opacity-20" />
          </div>

          <div className="flex flex-wrap gap-2">
            {route.muscles.map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 bg-black border border-slate-800 rounded-lg text-[7px] font-black uppercase text-slate-500"
              >
                {m}
              </span>
            ))}
          </div>

          <button
            onClick={() => handleStartRoutine(route)}
            className={`w-full py-4 rounded-[1.4rem] flex items-center justify-center gap-2 transition-all font-black uppercase italic text-[11px] tracking-widest active:scale-95 ${isOngoing ? "bg-slate-800 text-slate-600" : "bg-[var(--brand-primary)] text-black"}`}
          >
            <Play size={14} fill="currentColor" />
            {isOngoing ? "Ongoing session..." : "Start Routine"}
          </button>
        </div>
      ))}
    </div>
  );
};
