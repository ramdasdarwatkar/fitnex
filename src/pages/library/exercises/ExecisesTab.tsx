import { useEffect, useState } from "react";
import { db } from "../../../db/database";
import { Dumbbell, Activity } from "lucide-react";
import type { Database } from "../../../types/database.types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export const ExercisesTab = ({ search }: { search: string }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const loadExercises = async () => {
      const data = await db.exercises.orderBy("name").toArray();
      setExercises(data);
    };
    loadExercises();
  }, []);

  const filtered = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.category?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 gap-3">
      {filtered.map((ex) => (
        <div
          key={ex.id}
          className="group p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[1.8rem] active:scale-[0.98] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--brand-primary)]">
              <Dumbbell size={20} />
            </div>
            <div>
              <p className="text-[13px] font-black uppercase italic text-[var(--text-main)] leading-tight">
                {ex.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-[var(--brand-primary)] uppercase tracking-tighter bg-[var(--brand-primary)] bg-opacity-10 px-2 py-0.5 rounded-md">
                  {ex.category || "Strength"}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                  {ex.force_type || "Compound"}
                </span>
              </div>
            </div>
          </div>

          <button className="p-3 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors">
            <Activity size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
