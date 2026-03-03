import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Dumbbell, Loader2 } from "lucide-react";
import { ExerciseService } from "../../../services/ExerciseService";

// --- TYPES ---

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

// --- COMPONENT ---

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

  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.categoryName.toLowerCase().includes(query),
    );

    const groups: Record<string, ExerciseGroup> = {};
    filtered.forEach((ex) => {
      if (!groups[ex.category]) {
        groups[ex.category] = { name: ex.categoryName, items: [] };
      }
      groups[ex.category].items.push(ex);
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, query]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary/40" size={30} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      {groupedExercises.map((group) => (
        <div key={group.name} className="flex flex-col gap-3">
          {/* Sticky group label */}
          <div className="sticky top-0 z-10 py-3 bg-bg-main/95 backdrop-blur-md flex items-center gap-3">
            <h2
              className="text-[10px] font-black uppercase italic text-brand-primary
                           tracking-[0.3em] whitespace-nowrap"
            >
              {group.name}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border-color/40 to-transparent" />
          </div>

          <div className="grid gap-2.5">
            {group.items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/library/exercises/${ex.id}`)}
                className="w-full flex items-center justify-between p-4 bg-bg-surface
                           border border-border-color/40 rounded-2xl
                           active:scale-[0.97] transition-all group card-glow
                           hover:border-brand-primary/30"
              >
                <div className="flex flex-col text-left gap-1 min-w-0">
                  <span
                    className="text-[13px] font-black uppercase italic text-text-main
                                   group-hover:text-brand-primary transition-colors
                                   tracking-tight truncate"
                  >
                    {ex.name}
                  </span>
                  <span
                    className="text-[9px] font-black uppercase italic
                                   text-text-muted/40 tracking-widest"
                  >
                    {ex.equipmentName}
                  </span>
                </div>

                <div
                  className="w-8 h-8 rounded-xl bg-bg-main border border-border-color/40
                                flex items-center justify-center text-text-muted/40 shrink-0 ml-3
                                group-hover:text-brand-primary group-hover:border-brand-primary/30
                                transition-all duration-200"
                >
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {groupedExercises.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-32
                        text-text-muted/20 animate-in zoom-in-95 duration-400"
        >
          <Dumbbell size={44} strokeWidth={1} className="mb-4" />
          <p className="text-[10px] font-black uppercase italic tracking-[0.4em]">
            No exercises found
          </p>
        </div>
      )}
    </div>
  );
};
