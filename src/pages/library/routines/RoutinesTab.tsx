import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LibraryService,
  type EnrichedRoutine,
} from "../../../services/LibraryService";
import { Play, ClipboardList, ChevronRight } from "lucide-react";

export const RoutinesTab = ({ search }: { search: string }) => {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<EnrichedRoutine[]>([]);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [data, active] = await Promise.all([
        LibraryService.getRoutinesWithMeta(),
        LibraryService.getActiveWorkout(),
      ]);
      setRoutines(data);
      setHasActiveWorkout(!!active);
    };
    loadData();
  }, []);

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    /* flex-1 ensures the background color is forced to the bottom */
    <div className="flex-1 flex flex-col gap-4">
      {/* ROUTINE CARDS */}
      {filtered.map((route) => (
        <div
          key={route.id}
          className="bg-[var(--bg-surface)] border border-slate-800 rounded-[2.2rem] p-6 space-y-5 shadow-sm active:scale-[0.99] transition-transform"
        >
          {/* HEADER AREA - Clickable to go to Detail/Edit */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => navigate(`/library/routines/${route.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--brand-primary)]">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase italic text-[var(--text-main)] leading-none">
                  {route.name}
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                  {route.exercise_count} Exercises
                </p>
              </div>
            </div>
            <div className="p-2 opacity-30">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* MUSCLE PREVIEW CHIPS */}
          <div className="flex flex-wrap gap-1.5">
            {route.muscles.map((m) => (
              <span
                key={m}
                className="text-[7px] font-black uppercase px-2.5 py-1.5 bg-[var(--bg-main)] border border-slate-800 text-slate-500 rounded-lg"
              >
                {m}
              </span>
            ))}
          </div>

          {/* START WORKOUT BUTTON */}
          <button
            disabled={hasActiveWorkout}
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigating to detail
              console.log("Starting workout logic...");
            }}
            className={`w-full py-4 rounded-[1.4rem] flex items-center justify-center gap-2 transition-all font-black uppercase italic text-[11px] tracking-[0.1em]
              ${
                hasActiveWorkout
                  ? "bg-slate-900 text-slate-600 border border-slate-800 opacity-60"
                  : "bg-[var(--brand-primary)] text-black shadow-lg shadow-[var(--brand-primary)]/20 active:scale-95"
              }`}
          >
            <Play size={14} fill="currentColor" />
            {hasActiveWorkout ? "Session in Progress" : "Start Workout"}
          </button>
        </div>
      ))}

      {/* THE SPRING: Pushes everything up but stays flush to the bottom */}
      <div className="flex-1" />
    </div>
  );
};
