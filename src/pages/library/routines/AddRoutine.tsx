import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  LibraryService,
  type EnrichedExercise,
} from "../../../services/LibraryService";
import { RoutineService } from "../../../services/RoutineService"; // Updated Service
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  Check,
  Plus,
  Minus,
  MoveVertical,
  Lock,
  Globe,
} from "lucide-react";

export const AddRoutine = () => {
  const navigate = useNavigate();
  const { user_id } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [search, setSearch] = useState("");
  const [library, setLibrary] = useState<EnrichedExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

  useEffect(() => {
    LibraryService.getExercisesWithMeta().then(setLibrary);
  }, []);

  const muscleFocus = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedExercises.forEach((ex) => {
      ex.all_muscles
        ?.filter((m: any) => m.role === "primary")
        .forEach((m: any) => {
          counts[m.name] = (counts[m.name] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [selectedExercises]);

  const addExercise = (ex: EnrichedExercise) => {
    setSelectedExercises([
      ...selectedExercises,
      { ...ex, target_sets: 3, target_reps: 10 },
    ]);
    setSearch("");
  };

  const removeExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTarget = (index: number, field: string, val: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: val } : ex)),
    );
  };

  const onSave = async () => {
    if (!name || !user_id || selectedExercises.length === 0) return;
    try {
      const payload = {
        name,
        description,
        is_public: isPublic,
        user_id: user_id, // Ensure column name matches your DB (usually user_id or created_by)
      };
      await RoutineService.addRoutine(payload, selectedExercises);
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Error saving routine.");
    }
  };

  return (
    <SubPageLayout title="New Routine">
      <div className="flex-1 flex flex-col gap-6 pb-32">
        {/* 1. NAME & PRIVACY */}
        <div className="bg-[var(--bg-surface)] border border-slate-800 p-6 rounded-[2.2rem] space-y-6">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ROUTINE NAME"
            className="w-full bg-transparent text-2xl font-black italic text-[var(--text-main)] outline-none uppercase tracking-tighter"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="DESCRIPTION (OPTIONAL)"
            className="w-full bg-[var(--bg-main)] border border-slate-800 rounded-2xl p-4 text-xs font-bold text-[var(--text-main)] outline-none resize-none h-24 placeholder:text-slate-700"
          />

          <div className="flex gap-2">
            <PrivacyToggle
              active={!isPublic}
              label="Private"
              icon={<Lock size={12} />}
              onClick={() => setIsPublic(false)}
            />
            <PrivacyToggle
              active={isPublic}
              label="Public"
              icon={<Globe size={12} />}
              primary
              onClick={() => setIsPublic(true)}
            />
          </div>

          {muscleFocus.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {muscleFocus.map(([mName]) => (
                <span
                  key={mName}
                  className="text-[8px] font-black uppercase px-3 py-1.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full border border-[var(--brand-primary)]/20"
                >
                  {mName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2. SEARCH */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ADD EXERCISE..."
            className="w-full bg-[var(--bg-surface)] border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-xs font-black uppercase italic outline-none focus:border-[var(--brand-primary)]"
          />
          {search && (
            <div className="absolute top-[110%] left-0 w-full bg-[var(--bg-surface)] border-2 border-slate-800 rounded-[2rem] shadow-2xl z-50 max-h-64 overflow-y-auto">
              {library
                .filter((ex) =>
                  ex.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="w-full p-5 text-left border-b border-slate-800 last:border-0 hover:bg-slate-900 font-black uppercase italic text-xs text-[var(--text-main)]"
                  >
                    {ex.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* 3. SELECTED EXERCISES */}
        <div className="space-y-3">
          {selectedExercises.map((ex, idx) => (
            <div
              key={`${ex.id}-${idx}`}
              className="bg-[var(--bg-surface)] border border-slate-800 rounded-[1.8rem] p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoveVertical size={16} className="text-slate-700" />
                  <span className="text-xs font-black uppercase italic text-[var(--text-main)]">
                    {ex.name}
                  </span>
                </div>
                <button
                  onClick={() => removeExercise(idx)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Counter
                  label="Sets"
                  value={ex.target_sets}
                  onDec={() =>
                    updateTarget(
                      idx,
                      "target_sets",
                      Math.max(1, ex.target_sets - 1),
                    )
                  }
                  onInc={() =>
                    updateTarget(idx, "target_sets", ex.target_sets + 1)
                  }
                />
                <Counter
                  label="Reps"
                  value={ex.target_reps}
                  onDec={() =>
                    updateTarget(
                      idx,
                      "target_reps",
                      Math.max(1, ex.target_reps - 1),
                    )
                  }
                  onInc={() =>
                    updateTarget(idx, "target_reps", ex.target_reps + 1)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onSave}
          className="w-full py-5 bg-[var(--brand-primary)] text-black font-black uppercase italic rounded-3xl shadow-xl shadow-[var(--brand-primary)]/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3 tracking-widest mt-4"
        >
          <Check size={20} strokeWidth={4} /> CREATE TEMPLATE
        </button>

        {/* THE SPRING */}
        <div className="flex-1" />
      </div>
    </SubPageLayout>
  );
};

/* Internal UI Sub-Components */
const PrivacyToggle = ({ active, label, icon, onClick, primary }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
      active
        ? primary
          ? "bg-[var(--brand-primary)] text-black border-[var(--brand-primary)]"
          : "bg-white text-black border-white"
        : "border-slate-800 text-slate-500"
    }`}
  >
    {icon} {label}
  </button>
);

const Counter = ({ label, value, onDec, onInc }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
    <span className="text-[8px] font-black uppercase text-slate-500">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <button
        onClick={onDec}
        className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center justify-center border border-slate-800 text-[var(--text-main)]"
      >
        <Minus size={10} />
      </button>
      <span className="text-xs font-black text-[var(--text-main)]">
        {value}
      </span>
      <button
        onClick={onInc}
        className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center justify-center border border-slate-800 text-[var(--text-main)]"
      >
        <Plus size={10} />
      </button>
    </div>
  </div>
);
