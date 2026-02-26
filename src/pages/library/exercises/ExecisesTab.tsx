import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Dumbbell, Loader2 } from "lucide-react";
import { ExerciseService } from "../../../services/ExerciseService";

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
    ExerciseService.getExercisesForList().then((data) => {
      setExercises(data as ExerciseListItem[]);
      setLoading(false);
    });
  }, []);

  const query = search.toLowerCase().trim();

  // GROUPING & SEARCHING - Logic preserved, styling sanitized
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2
          className="animate-spin text-text-muted opacity-20"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      {groupedExercises.map((group) => (
        <div key={group.name} className="flex flex-col gap-3">
          {/* REFINED CATEGORY HEADER */}
          <div className="sticky top-0 z-10 py-3 bg-bg-main/80 backdrop-blur-md flex items-center gap-3">
            <h2 className="text-[11px] font-bold uppercase text-brand-primary tracking-widest whitespace-nowrap ml-1">
              {group.name}
            </h2>
            <div className="h-px flex-1 bg-border-color/20" />
          </div>

          <div className="grid gap-2.5">
            {group.items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/library/exercises/${ex.id}`)}
                className="w-full flex items-center justify-between p-4 bg-bg-surface border border-border-color rounded-xl active:scale-[0.98] transition-all group shadow-sm"
              >
                <div className="flex flex-col text-left gap-1">
                  <span className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors">
                    {ex.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-text-muted opacity-60 tracking-wider">
                      {ex.equipmentName}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-bg-main border border-border-color flex items-center justify-center text-text-muted group-hover:text-brand-primary group-hover:border-brand-primary transition-all shadow-sm">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* EMPTY STATE */}
      {groupedExercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 opacity-20 text-text-muted animate-in zoom-in-95 duration-300">
          <Dumbbell size={48} strokeWidth={1.5} className="mb-4" />
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]">
            No Exercises Found
          </p>
        </div>
      )}
    </div>
  );
};
