import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Dumbbell } from "lucide-react";
import { LibraryService } from "../../../services/LibraryService";

export const ExercisesTab = ({ search }: { search: string }) => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LibraryService.getExercisesForList().then((data) => {
      setExercises(data);
      setLoading(false);
    });
  }, []);

  const query = search.toLowerCase().trim();

  // GROUPING & SEARCHING
  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter((ex) => {
      return (
        ex.name.toLowerCase().includes(query) ||
        ex.categoryName.toLowerCase().includes(query)
      );
    });

    const groups: Record<string, { name: string; items: any[] }> = {};

    filtered.forEach((ex) => {
      if (!groups[ex.category]) {
        groups[ex.category] = {
          name: ex.categoryName,
          items: [],
        };
      }
      groups[ex.category].items.push(ex);
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, query]);

  if (loading) return null;

  return (
    <div className="flex-1 flex flex-col gap-8 pb-32">
      {groupedExercises.map((group) => (
        <div key={group.name} className="flex flex-col gap-4">
          {/* MINIMAL CATEGORY HEADER */}
          <div className="sticky top-0 z-10 py-3 bg-[var(--bg-main)] flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase italic text-[var(--brand-primary)] tracking-[0.2em] whitespace-nowrap">
              {group.name}
            </h2>
            <div className="h-px flex-1 bg-slate-800/50" />
          </div>

          <div className="space-y-2">
            {group.items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/library/exercises/${ex.id}`)}
                className="w-full flex items-center justify-between p-5 bg-[var(--bg-surface)] border border-slate-800/50 rounded-[2rem] active:scale-[0.98] transition-all group"
              >
                <div className="flex flex-col text-left gap-1">
                  <span className="text-[14px] font-black uppercase italic text-[var(--text-main)] tracking-tight">
                    {ex.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
                    {ex.equipmentName}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 group-hover:text-[var(--brand-primary)] transition-colors">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {groupedExercises.length === 0 && (
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
