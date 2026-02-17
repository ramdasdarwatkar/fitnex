import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Search, Check } from "lucide-react";
import { db } from "../../../db/database";

export const ExercisePicker = ({ onClose, onAdd }: any) => {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<string[]>([]);

  const exercises = useLiveQuery(() => db.exercises.toArray()) || [];
  const exerciseMuscles =
    useLiveQuery(() => db.exercise_muscles.toArray()) || [];
  const muscles = useLiveQuery(() => db.muscles.toArray()) || [];

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    exercises.forEach((ex) => {
      const assoc = exerciseMuscles.find((em) => em.exercise_id === ex.id);
      const muscle = muscles.find((m) => m.id === assoc?.muscle_id);
      const category = muscle?.parent || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(ex);
    });
    return groups;
  }, [exercises, exerciseMuscles, muscles]);

  const toggle = (id: string) => {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="p-6 flex items-center justify-between border-b border-slate-800 bg-black">
        <h2 className="text-lg font-black uppercase italic text-white">
          Add Exercises
        </h2>
        <button onClick={onClose} className="p-2 text-slate-500">
          <X size={24} />
        </button>
      </header>

      <div className="p-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movements..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 text-xs font-black uppercase italic text-white outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-8">
            {/* CLEAR CATEGORY LABEL */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[2px] w-4 bg-[var(--brand-primary)]" />
              <h3 className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em]">
                {category}
              </h3>
            </div>
            <div className="space-y-2">
              {items
                .filter((i) =>
                  i.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => toggle(ex.id)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selection.includes(ex.id) ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-black" : "bg-slate-900 border-slate-800 text-slate-400"}`}
                  >
                    <span className="text-xs font-black uppercase italic">
                      {ex.name}
                    </span>
                    {selection.includes(ex.id) && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-[var(--brand-primary)] text-[10px] font-black">
                        {selection.indexOf(ex.id) + 1}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={() => onAdd(selection)}
          disabled={selection.length === 0}
          className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase italic tracking-widest shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
        >
          Add {selection.length} Exercises
        </button>
      </div>
    </div>
  );
};
