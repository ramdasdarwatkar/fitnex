import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/database";
import { X, Search, Check, Dumbbell } from "lucide-react";

// --- 1. STRICT INTERFACES ---

interface ExercisePickerProps {
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

interface ExerciseMeta {
  topLevel: string;
  equipmentNames: string[];
  searchTerms: string[];
}

// --- 2. MAIN COMPONENT ---

export const ExercisePicker = ({ onClose, onAdd }: ExercisePickerProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // 1. Fetch tables from Dexie
  const liveExercises = useLiveQuery(() => db.exercises.toArray());
  const liveExMuscles = useLiveQuery(() => db.exercise_muscles.toArray());
  const liveMuscles = useLiveQuery(() => db.muscles.toArray());
  const liveExEquipment = useLiveQuery(() => db.exercise_equipment.toArray());
  const liveEquipment = useLiveQuery(() => db.equipment.toArray());

  // 2. STABILIZATION: Move the logical OR inside useMemo to keep references stable
  const exercises = useMemo(() => liveExercises || [], [liveExercises]);
  const exMuscles = useMemo(() => liveExMuscles || [], [liveExMuscles]);
  const muscles = useMemo(() => liveMuscles || [], [liveMuscles]);
  const exEquipment = useMemo(() => liveExEquipment || [], [liveExEquipment]);
  const equipment = useMemo(() => liveEquipment || [], [liveEquipment]);

  // 3. Pre-process Relational Metadata for Search
  const exerciseMetadata = useMemo(() => {
    const map: Record<string, ExerciseMeta> = {};

    exercises.forEach((ex) => {
      // Primary Muscle Resolution
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

      // Equipment Resolution
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

  // 4. Grouping & Filtering
  const groupedExercises = useMemo(() => {
    const query = search.toLowerCase().trim();

    const filtered = exercises.filter((ex) => {
      const meta = exerciseMetadata[ex.id];
      return !query || meta?.searchTerms.some((term) => term.includes(query));
    });

    const groups: Record<string, typeof exercises> = {};
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
        {} as Record<string, typeof exercises>,
      );
  }, [exercises, search, exerciseMetadata]);

  return (
    <div className="fixed inset-0 z-600 bg-bg-main flex flex-col animate-in slide-in-from-bottom duration-500 ease-out">
      {/* HEADER SECTION */}
      <div className="pt-[env(safe-area-inset-top)] bg-bg-main/90 backdrop-blur-2xl border-b border-border-color sticky top-0 z-20 shadow-xl">
        <div className="p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-text-muted p-2 active:scale-75 transition-all"
          >
            <X size={24} />
          </button>
          <h2 className="text-[10px] font-black uppercase italic text-text-main tracking-[0.4em]">
            EXERCISE VAULT
          </h2>
          <button
            onClick={() => onAdd(selected)}
            disabled={selected.length === 0}
            className={`px-7 py-2.5 rounded-2xl text-[10px] font-black uppercase italic transition-all active:scale-95 ${
              selected.length > 0
                ? "bg-brand-primary text-bg-main shadow-lg shadow-brand-primary/20"
                : "bg-bg-surface text-text-muted opacity-40 grayscale pointer-events-none"
            }`}
          >
            Deploy ({selected.length})
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted opacity-50"
              size={18}
            />
            <input
              type="text"
              placeholder="Search muscle, gear, or exercise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-border-color rounded-4xl py-5 pl-14 pr-6 text-text-main font-bold outline-none focus:ring-2 ring-brand-primary/20 transition-all placeholder:opacity-20 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* EXERCISE LIST */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 pt-6 space-y-12">
        {Object.entries(groupedExercises).map(([group, list]) => (
          <div key={group} className="space-y-5">
            <div className="flex items-center gap-4 sticky top-0 bg-bg-main py-3 z-10">
              <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] italic whitespace-nowrap">
                {group}
              </h3>
              <div className="h-px w-full bg-border-color/30" />
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {list.map((ex) => {
                const isSelected = selected.includes(ex.id);
                const meta = exerciseMetadata[ex.id];

                return (
                  <button
                    key={ex.id}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(ex.id)
                          ? prev.filter((i) => i !== ex.id)
                          : [...prev, ex.id],
                      )
                    }
                    className={`flex items-center justify-between p-6 rounded-[2.5rem] border transition-all active:scale-[0.97] text-left ${
                      isSelected
                        ? "bg-brand-primary/5 border-brand-primary shadow-lg shadow-brand-primary/5"
                        : "bg-bg-surface border-border-color/50 hover:border-text-muted"
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-brand-primary border-brand-primary shadow-lg"
                            : "border-border-color bg-bg-main"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={16}
                            strokeWidth={4}
                            className="text-bg-main"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <span
                          className={`text-[15px] font-black uppercase italic block tracking-tight ${
                            isSelected ? "text-text-main" : "text-text-main/80"
                          }`}
                        >
                          {ex.name}
                        </span>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {meta?.equipmentNames.map((name) => (
                            <div
                              key={name}
                              className="flex items-center gap-1.5 bg-bg-main px-3 py-1 rounded-lg border border-border-color shadow-sm"
                            >
                              <Dumbbell
                                size={11}
                                className="text-brand-primary opacity-70"
                              />
                              <span className="text-[9px] font-black uppercase text-text-muted italic">
                                {name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
