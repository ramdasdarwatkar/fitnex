import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Dumbbell } from "lucide-react";
import { LibraryService } from "../../../services/LibraryService";

// --- 1. STRICT INTERFACES ---

interface ExerciseListItem {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  equipmentName: string;
}

interface ExerciseGroup {
  name: string;
  items: ExerciseListItem[];
}

// --- 2. MAIN COMPONENT ---

export const ExercisesTab = ({ search }: { search: string }) => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LibraryService.getExercisesForList().then((data) => {
      setExercises(data as ExerciseListItem[]);
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

    const groups: Record<string, ExerciseGroup> = {};

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
    <div className="flex-1 flex flex-col gap-10 pb-32 animate-in fade-in duration-500">
      {groupedExercises.map((group) => (
        <div key={group.name} className="flex flex-col gap-5">
          {/* SEMANTIC CATEGORY HEADER */}
          <div className="sticky top-0 z-10 py-4 bg-bg-main/90 backdrop-blur-md flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase italic text-brand-primary tracking-[0.3em] whitespace-nowrap">
              {group.name}
            </h2>
            <div className="h-px flex-1 bg-border-color/30" />
          </div>

          <div className="space-y-3">
            {group.items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/library/exercises/${ex.id}`)}
                className="w-full flex items-center justify-between p-6 bg-bg-surface border border-border-color/50 rounded-[2.5rem] active:scale-[0.97] hover:border-brand-primary/50 transition-all group shadow-sm"
              >
                <div className="flex flex-col text-left gap-1.5">
                  <span className="text-[15px] font-black uppercase italic text-text-main tracking-tight group-hover:text-brand-primary transition-colors">
                    {ex.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-primary/40" />
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest opacity-60">
                      {ex.equipmentName}
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-bg-main border border-border-color flex items-center justify-center text-text-muted group-hover:text-brand-primary group-hover:border-brand-primary transition-all shadow-inner">
                  <ChevronRight size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* EMPTY STATE */}
      {groupedExercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 opacity-20 text-text-muted animate-in zoom-in-95 duration-300">
          <Dumbbell size={64} strokeWidth={1} className="mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">
            No Exercises Found
          </p>
        </div>
      )}
    </div>
  );
};
