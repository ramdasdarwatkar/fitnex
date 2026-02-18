import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/database";
import { X, Search, Check } from "lucide-react";

interface ExercisePickerProps {
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

export const ExercisePicker = ({ onClose, onAdd }: ExercisePickerProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Fetch all necessary tables
  const exercises = useLiveQuery(() => db.exercises.toArray()) || [];
  const exMuscles = useLiveQuery(() => db.exercise_muscles.toArray()) || [];
  const muscles = useLiveQuery(() => db.muscles.toArray()) || [];

  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter((ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()),
    );

    const groups: Record<string, any[]> = {};

    filtered.forEach((ex) => {
      // 1. Get primary muscle link
      const link = exMuscles.find(
        (em) => em.exercise_id === ex.id && em.role === "primary",
      );

      // 2. Resolve to the Top-Level Parent
      let muscle = muscles.find((m) => m.id === link?.muscle_id);

      // If the muscle has a parent, keep going up until we find the root
      let safetyCounter = 0;
      while (muscle?.parent && safetyCounter < 5) {
        const parentMuscle = muscles.find((m) => m.id === muscle?.parent);
        if (!parentMuscle) break;
        muscle = parentMuscle;
        safetyCounter++;
      }

      const topLevelGroupName = muscle?.name || "Other";

      if (!groups[topLevelGroupName]) groups[topLevelGroupName] = [];
      groups[topLevelGroupName].push(ex);
    });

    // Sort the group keys (e.g., Chest, Back, Legs)
    return Object.keys(groups)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, any[]>,
      );
  }, [exercises, exMuscles, muscles, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-900 bg-black/80 backdrop-blur-xl sticky top-0 z-10">
        <button
          onClick={onClose}
          className="text-slate-400 p-2 active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
        <h2 className="text-sm font-black uppercase italic text-white tracking-widest">
          Select Exercises
        </h2>
        <button
          onClick={() => onAdd(selected)}
          disabled={selected.length === 0}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${
            selected.length > 0
              ? "bg-[var(--brand-primary)] text-black shadow-lg shadow-[var(--brand-primary)]/20"
              : "bg-slate-800 text-slate-500 opacity-50"
          }`}
        >
          Add ({selected.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 bg-black/40">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--brand-primary)] transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--brand-primary)] focus:bg-slate-900 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Grouped List */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-10 custom-scrollbar">
        {Object.entries(groupedExercises).map(([group, list]) => (
          <div key={group} className="space-y-4">
            {/* Top Level Category Header */}
            <div className="flex items-center gap-3 sticky top-0 bg-black py-2 z-[5]">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-800" />
              <h3 className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em] italic">
                {group}
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-800" />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {list.map((ex) => {
                const isSelected = selected.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleSelect(ex.id)}
                    className={`flex items-center justify-between p-5 rounded-[1.8rem] border transition-all active:scale-[0.97] ${
                      isSelected
                        ? "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/50 shadow-[0_0_20px_rgba(204,255,0,0.05)]"
                        : "bg-slate-900/30 border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] scale-110"
                            : "border-slate-700 bg-black/20"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            strokeWidth={4}
                            className="text-black"
                          />
                        )}
                      </div>
                      <div>
                        <span
                          className={`text-[14px] font-black uppercase italic block ${isSelected ? "text-white" : "text-slate-300"}`}
                        >
                          {ex.name}
                        </span>
                        {/* Sub-muscle hint (optional) */}
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                          {ex.force || "Strength"} • {ex.mechanic || "Compound"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedExercises).length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
              <Search size={30} />
            </div>
            <p className="text-slate-600 font-black uppercase italic text-sm tracking-widest">
              No matches found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
