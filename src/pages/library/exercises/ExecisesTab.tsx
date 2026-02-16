import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ChevronRight, Target } from "lucide-react";
import { LibraryService } from "../../../services/LibraryService";

export const ExercisesTab = ({ search }: { search: string }) => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LibraryService.getExercisesWithMeta().then((data) => {
      setExercises(data);
      setLoading(false);
    });
  }, []);

  const query = search.toLowerCase().trim();

  // DEEP FILTER LOGIC
  const filtered = exercises.filter((ex) => {
    // 1. Match Exercise Name
    const nameMatch = ex.name.toLowerCase().includes(query);

    // 2. Match Any Linked Muscle (Name or Parent Name)
    const muscleMatch = ex.all_muscles?.some(
      (m: any) =>
        m.name.toLowerCase().includes(query) ||
        m.parent_name?.toLowerCase().includes(query),
    );

    // 3. Match Equipment
    const equipMatch = ex.equipment_name?.toLowerCase().includes(query);

    return nameMatch || muscleMatch || equipMatch;
  });

  if (loading) return null;

  return (
    <div className="space-y-3">
      {filtered.map((ex) => (
        <button
          key={ex.id}
          onClick={() => navigate(`/library/exercises/${ex.id}`)}
          className="w-full flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2rem] active:scale-[0.98] transition-all group animate-in fade-in"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--bg-main)] transition-all flex-shrink-0">
              <Dumbbell size={20} />
            </div>

            <div className="text-left flex-1">
              <p className="text-[13px] font-black uppercase italic text-[var(--text-main)] tracking-tight leading-tight mb-2">
                {ex.name}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Equipment Badge */}
                <span className="text-[7px] font-black uppercase px-2 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-md">
                  {ex.equipment_name}
                </span>

                {/* Muscle Tags */}
                {ex.all_muscles?.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                      m.role === "primary"
                        ? "border-orange-500/20 bg-orange-500/5 text-orange-500"
                        : m.role === "secondary"
                          ? "border-blue-500/20 bg-blue-500/5 text-blue-500"
                          : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                    }`}
                  >
                    <span className="text-[7px] font-black uppercase italic">
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ChevronRight
            size={16}
            className="text-[var(--text-muted)] opacity-30 ml-2"
          />
        </button>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <Dumbbell size={48} strokeWidth={1} className="mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            No Results
          </p>
        </div>
      )}
    </div>
  );
};
