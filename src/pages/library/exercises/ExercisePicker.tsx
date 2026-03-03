import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Dumbbell, Loader2 } from "lucide-react";
import { ExerciseService } from "../../../services/ExerciseService";

// --- TYPES ---

interface ExercisePickerProps {
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  excludedIds?: string[];
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

// --- COMPONENT ---

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

  const hasSelection = selected.length > 0;

  const pickerUI = (
    <div className="fixed inset-0 z-50 bg-bg-main flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* ── HEADER ── */}
      <div className="bg-bg-main/95 backdrop-blur-md border-b border-border-color/40 shrink-0">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-4">
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-text-muted/60 active:scale-75 transition-all rounded-xl
                       hover:bg-bg-surface hover:text-text-main"
          >
            <X size={22} />
          </button>

          <h2 className="text-[10px] font-black uppercase italic tracking-[0.3em] text-text-main">
            Select Training
          </h2>

          {/* Add button */}
          <button
            onClick={() => onAdd(selected)}
            disabled={!hasSelection}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase italic
                        tracking-widest transition-all
                        ${
                          hasSelection
                            ? "bg-brand-primary active:scale-[0.97]"
                            : "bg-bg-surface text-text-muted/30 pointer-events-none"
                        }`}
            style={
              hasSelection
                ? {
                    color: "var(--color-on-brand)",
                    boxShadow: "0 2px 12px var(--glow-primary)",
                  }
                : undefined
            }
          >
            Add {hasSelection ? `(${selected.length})` : ""}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40
                         group-focus-within:text-brand-primary transition-colors pointer-events-none"
              size={15}
            />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-border-color/40 rounded-2xl
                         py-3.5 pl-11 pr-4 text-[13px] font-black italic text-text-main
                         outline-none focus:border-brand-primary/40 transition-colors
                         placeholder:text-text-muted/20"
            />
          </div>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-16 pt-4 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary" size={30} />
          </div>
        ) : groupedExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted/20">
            <Dumbbell size={40} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">
              No exercises found
            </p>
          </div>
        ) : (
          groupedExercises.map((group) => (
            <div key={group.name} className="space-y-3">
              {/* Sticky group header */}
              <div className="flex items-center gap-3 sticky top-0 bg-bg-main/95 backdrop-blur-md py-2 z-10">
                <h3
                  className="text-[10px] font-black italic text-brand-primary uppercase
                               tracking-[0.25em] whitespace-nowrap"
                >
                  {group.name}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-border-color/30 to-transparent" />
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
                      className={`flex items-center gap-4 p-4 rounded-2xl border
                                  transition-all duration-200 text-left
                                  ${
                                    isExcluded
                                      ? "opacity-25 grayscale pointer-events-none bg-bg-surface/50 border-border-color/20"
                                      : isSelected
                                        ? "bg-brand-primary/[0.06] border-brand-primary/50 active:scale-[0.98]"
                                        : "bg-bg-surface border-border-color/40 hover:border-brand-primary/20 active:scale-[0.98]"
                                  }`}
                      style={
                        isSelected && !isExcluded
                          ? {
                              boxShadow: "0 0 0 1px var(--glow-primary)",
                            }
                          : undefined
                      }
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center
                                    shrink-0 transition-all
                                    ${
                                      isExcluded
                                        ? "bg-text-muted/10 border-text-muted/20"
                                        : isSelected
                                          ? "bg-brand-primary border-brand-primary"
                                          : "border-border-color/50 bg-bg-main"
                                    }`}
                        style={
                          isSelected && !isExcluded
                            ? {
                                boxShadow: "0 0 8px var(--glow-primary)",
                              }
                            : undefined
                        }
                      >
                        {(isSelected || isExcluded) && (
                          <Check
                            size={13}
                            strokeWidth={3.5}
                            style={{
                              color: isExcluded
                                ? "var(--text-muted)"
                                : "var(--color-on-brand)",
                            }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-0.5 min-w-0">
                        <span
                          className={`text-[13px] font-black uppercase italic tracking-tight block truncate
                                      ${isExcluded ? "line-through text-text-muted/60" : "text-text-main"}`}
                        >
                          {ex.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Dumbbell
                            size={11}
                            className={
                              isExcluded
                                ? "text-text-muted/30"
                                : "text-brand-primary/60"
                            }
                          />
                          <span className="text-[9px] font-black uppercase italic text-text-muted/40 tracking-widest">
                            {isExcluded ? "Already added" : ex.equipmentName}
                          </span>
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
