import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/database";
import { X, Search, Check, Dumbbell } from "lucide-react";

interface ExercisePickerProps {
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

export const ExercisePicker = ({ onClose, onAdd }: ExercisePickerProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // 1. Fetch all required tables
  const exercises = useLiveQuery(() => db.exercises.toArray()) || [];
  const exMuscles = useLiveQuery(() => db.exercise_muscles.toArray()) || [];
  const muscles = useLiveQuery(() => db.muscles.toArray()) || [];
  const exEquipment = useLiveQuery(() => db.exercise_equipment.toArray()) || [];
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];

  // 2. Pre-process Metadata (Muscles + Equipment) for Search and UI
  const exerciseMetadata = useMemo(() => {
    const map: Record<
      string,
      { topLevel: string; equipmentNames: string[]; searchTerms: string[] }
    > = {};

    exercises.forEach((ex) => {
      // Resolve Muscles
      const muscleLink = exMuscles.find(
        (em) => em.exercise_id === ex.id && em.role === "primary",
      );
      let currentMuscle = muscles.find((m) => m.id === muscleLink?.muscle_id);
      const muscleHierarchy: string[] = currentMuscle
        ? [currentMuscle.name.toLowerCase()]
        : [];

      let safety = 0;
      while (currentMuscle?.parent && safety < 5) {
        const parent = muscles.find((m) => m.id === currentMuscle?.parent);
        if (!parent) break;
        currentMuscle = parent;
        muscleHierarchy.push(currentMuscle.name.toLowerCase());
        safety++;
      }

      // Resolve Equipment from join table
      const equipLinks = exEquipment.filter((ee) => ee.exercise_id === ex.id);
      const equipNames = equipLinks
        .map(
          (link) =>
            equipment.find((e) => e.id === link.equipment_id)?.name || "",
        )
        .filter(Boolean);

      map[ex.id] = {
        topLevel: currentMuscle?.name || "Other",
        equipmentNames: equipNames,
        searchTerms: [
          ex.name.toLowerCase(),
          ...muscleHierarchy,
          ...equipNames.map((en) => en.toLowerCase()),
        ],
      };
    });
    return map;
  }, [exercises, exMuscles, muscles, exEquipment, equipment]);

  // 3. Filter and Grouping
  const groupedExercises = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = exercises.filter((ex) => {
      const meta = exerciseMetadata[ex.id];
      return !query || meta?.searchTerms.some((term) => term.includes(query));
    });

    const groups: Record<string, any[]> = {};
    filtered.forEach((ex) => {
      const groupName = exerciseMetadata[ex.id]?.topLevel || "Other";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(ex);
    });

    return Object.keys(groups)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, any[]>,
      );
  }, [exercises, search, exerciseMetadata]);

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Header with Notch & Search */}
      <div className="pt-[env(safe-area-inset-top)] bg-black/90 backdrop-blur-2xl border-b border-slate-900 sticky top-0 z-20">
        <div className="p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-slate-500 p-2 active:scale-75 transition-all"
          >
            <X size={24} />
          </button>
          <h2 className="text-[10px] font-black uppercase italic text-white tracking-[0.4em]">
            Exercise Library
          </h2>
          <button
            onClick={() => onAdd(selected)}
            disabled={selected.length === 0}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${
              selected.length > 0
                ? "bg-[var(--brand-primary)] text-black"
                : "bg-slate-800 text-slate-500 opacity-50"
            }`}
          >
            Add ({selected.length})
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search exercise, muscle, or equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 pt-6 space-y-12">
        {Object.entries(groupedExercises).map(([group, list]) => (
          <div key={group} className="space-y-4">
            <h3 className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em] italic sticky top-0 bg-black py-2 z-10">
              {group}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {list.map((ex) => {
                const isSelected = selected.includes(ex.id);
                const meta = exerciseMetadata[ex.id];

                return (
                  <div
                    key={ex.id}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(ex.id)
                          ? prev.filter((i) => i !== ex.id)
                          : [...prev, ex.id],
                      )
                    }
                    className={`flex items-center justify-between p-5 rounded-[2.2rem] border transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/50"
                        : "bg-slate-900/40 border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[var(--brand-primary)] border-[var(--brand-primary)]"
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

                      <div className="space-y-2">
                        <span
                          className={`text-[14px] font-black uppercase italic block ${isSelected ? "text-white" : "text-slate-200"}`}
                        >
                          {ex.name}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Equipment Badges from join table */}
                          {meta?.equipmentNames.map((name) => (
                            <div
                              key={name}
                              className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50"
                            >
                              <Dumbbell
                                size={10}
                                className="text-[var(--brand-primary)]"
                              />
                              <span className="text-[8px] font-black uppercase text-slate-300">
                                {name}
                              </span>
                            </div>
                          ))}

                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest ml-1">
                            {ex.force} • {ex.mechanic}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
