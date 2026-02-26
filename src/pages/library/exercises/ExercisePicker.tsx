import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Dumbbell, Loader2 } from "lucide-react";
import { ExerciseService } from "../../../services/ExerciseService";

// --- 1. STRICT INTERFACES ---

interface ExercisePickerProps {
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  excludedIds?: string[]; // New optional prop
}

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

export const ExercisePicker = ({
  onClose,
  onAdd,
  excludedIds = [],
}: ExercisePickerProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ExerciseService.getExercisesForList().then((data) => {
      setExercises(data as ExerciseListItem[]);
      setLoading(false);
    });
  }, []);

  const groupedExercises = useMemo(() => {
    const query = search.toLowerCase().trim();
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
  }, [exercises, search]);

  const pickerUI = (
    <div className="fixed inset-0 z-9999 bg-bg-main flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
      {/* HEADER */}
      <div className="bg-bg-main border-b border-border-color shrink-0 pt-safe-half">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-text-muted p-2 active:scale-90 transition-all"
          >
            <X size={22} />
          </button>

          <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-main">
            Select Exercises
          </h2>

          <button
            onClick={() => onAdd(selected)}
            disabled={selected.length === 0}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
              selected.length > 0
                ? "bg-brand-primary text-bg-main shadow-lg shadow-brand-primary/20"
                : "bg-bg-surface text-text-muted opacity-40 pointer-events-none"
            }`}
          >
            Add ({selected.length})
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-primary"
              size={16}
            />
            <input
              type="text"
              placeholder="Search exercises or equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-border-color/60 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold text-text-main outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 transition-all placeholder:font-normal placeholder:text-text-muted/40"
            />
          </div>
        </div>
      </div>

      {/* EXERCISE LIST */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="animate-spin text-brand-primary opacity-40"
              size={32}
            />
          </div>
        ) : (
          groupedExercises.map((group) => (
            <div key={group.name} className="space-y-4">
              <div className="flex items-center gap-4 sticky top-0 bg-bg-main/95 backdrop-blur-sm py-4 z-10">
                <h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] whitespace-nowrap">
                  {group.name}
                </h3>
                <div className="h-px w-full bg-border-color/20" />
              </div>

              <div className="grid gap-2.5">
                {group.items.map((ex) => {
                  const isSelected = selected.includes(ex.id);
                  const isExcluded = excludedIds.includes(ex.id);

                  return (
                    <button
                      key={ex.id}
                      disabled={isExcluded}
                      onClick={() =>
                        setSelected((prev) =>
                          prev.includes(ex.id)
                            ? prev.filter((i) => i !== ex.id)
                            : [...prev, ex.id],
                        )
                      }
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                        isExcluded
                          ? "opacity-40 grayscale pointer-events-none bg-bg-surface/50 border-border-color/20"
                          : isSelected
                            ? "bg-brand-primary/5 border-brand-primary shadow-sm active:scale-[0.98]"
                            : "bg-bg-surface border-border-color/40 hover:border-border-color active:scale-[0.98]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isExcluded
                              ? "bg-text-muted/10 border-text-muted/20"
                              : isSelected
                                ? "bg-brand-primary border-brand-primary shadow-md shadow-brand-primary/20"
                                : "border-border-color bg-bg-main"
                          }`}
                        >
                          {(isSelected || isExcluded) && (
                            <Check
                              size={14}
                              strokeWidth={4}
                              className={
                                isExcluded ? "text-text-muted" : "text-bg-main"
                              }
                            />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span
                            className={`text-sm font-bold text-text-main block tracking-tight ${isExcluded ? "line-through opacity-50" : ""}`}
                          >
                            {ex.name}
                          </span>
                          <div className="flex items-center gap-1.5 opacity-70">
                            <Dumbbell
                              size={11}
                              className={
                                isExcluded
                                  ? "text-text-muted"
                                  : "text-brand-primary"
                              }
                            />
                            <span className="text-[10px] font-semibold uppercase text-text-muted tracking-wide">
                              {isExcluded ? "Already Added" : ex.equipmentName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return createPortal(pickerUI, document.body);
};
