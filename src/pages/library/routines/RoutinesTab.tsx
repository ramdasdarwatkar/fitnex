import { useEffect, useState } from "react";
import { db } from "../../../db/database";
import { ClipboardList, Play, Clock } from "lucide-react";
import type { Database } from "../../../types/database.types";

type Routine = Database["public"]["Tables"]["routines"]["Row"];

export const RoutinesTab = ({ search }: { search: string }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    const loadRoutines = async () => {
      const data = await db.routines.toArray();
      setRoutines(data);
    };
    loadRoutines();
  }, []);

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {filtered.map((routine) => (
        <div
          key={routine.id}
          className="relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2rem] p-6 group"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)] opacity-5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">
                {routine.name}
              </h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">
                Last Performed:{" "}
                {routine.last_used
                  ? new Date(routine.last_used).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--brand-primary)] text-[var(--bg-main)] shadow-lg shadow-[var(--brand-primary)]/20 active:scale-90 transition-all cursor-pointer">
              <Play size={20} fill="currentColor" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ClipboardList
                size={14}
                className="text-[var(--brand-primary)]"
              />
              <span className="text-[11px] font-black italic text-[var(--text-main)] uppercase">
                {/* This would be a count from routine_exercises */}8 Exercises
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--text-muted)]" />
              <span className="text-[11px] font-black italic text-[var(--text-muted)] uppercase">
                ~45 Mins
              </span>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            No routines found
          </p>
        </div>
      )}
    </div>
  );
};
