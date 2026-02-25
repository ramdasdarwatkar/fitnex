import {
  useEffect,
  useState,
  useMemo,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  LibraryService,
  type EnrichedExercise,
} from "../../../services/LibraryService";
import { RoutineService } from "../../../services/RoutineService";
import {
  Check,
  Plus,
  Minus,
  MoveVertical,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import { ExercisePicker } from "../exercises/ExercisePicker";

// 1. Strict Interfaces
import type { Routine } from "../../../types/database.types";
import { useAuth } from "../../../hooks/useAuth";
import { ExerciseService } from "../../../services/ExerciseService";

export interface SelectedExercise extends EnrichedExercise {
  target_sets: number;
  target_reps: number;
}

// Sub-Component Interfaces
interface PrivacyToggleProps {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}

interface CounterProps {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}

export const AddRoutine = () => {
  const navigate = useNavigate();
  const { user_id } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState<EnrichedExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >([]);

  useEffect(() => {
    let isMounted = true;
    ExerciseService.getExercisesWithMeta().then((data) => {
      if (isMounted) setLibrary(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const muscleFocus = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedExercises.forEach((ex) => {
      ex.all_muscles
        ?.filter((m) => m.role === "primary")
        .forEach((m) => {
          counts[m.name] = (counts[m.name] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [selectedExercises]);

  const handleAddExercises = (ids: string[]) => {
    const newItems: SelectedExercise[] = ids.map((id) => {
      const ex = library.find((l) => l.id === id);
      return {
        ...(ex || ({} as EnrichedExercise)),
        target_sets: 3,
        target_reps: 10,
      } as SelectedExercise;
    });
    setSelectedExercises((prev) => [...prev, ...newItems]);
    setShowPicker(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTarget = (
    index: number,
    field: "target_sets" | "target_reps",
    val: number,
  ) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: val } : ex)),
    );
  };

  const onSave = async () => {
    if (!name.trim() || !user_id || selectedExercises.length === 0 || loading)
      return;

    setLoading(true);
    try {
      const now = new Date().toISOString();

      const routinePayload: Routine = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
        created_by: user_id,
        status: true,
        updated_at: now,
      };

      await RoutineService.addRoutine(routinePayload, selectedExercises);
      navigate(-1);
    } catch (err: unknown) {
      console.error("Save Routine Error:", err);
      alert("Error saving routine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubPageLayout title="New Routine">
      <div className="flex-1 flex flex-col gap-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-bg-surface border border-border-color p-6 rounded-[2.2rem] space-y-6 shadow-xl">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="ROUTINE NAME"
            className="w-full bg-transparent text-2xl font-black italic text-text-main outline-none uppercase tracking-tighter"
          />

          <textarea
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="DESCRIPTION (OPTIONAL)"
            className="w-full bg-bg-main border border-border-color rounded-2xl p-4 text-xs font-bold text-text-main outline-none resize-none h-24"
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
                  className="text-[8px] font-black uppercase px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20"
                >
                  {mName}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="w-full bg-bg-surface border border-border-color rounded-2xl py-6 px-6 flex items-center gap-4 text-text-muted active:scale-[0.98] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-bg-main flex items-center justify-center border border-border-color group-hover:border-brand-primary/40">
            <Plus size={18} className="text-brand-primary" />
          </div>
          <span className="text-xs font-black uppercase italic tracking-widest">
            Add Exercises
          </span>
        </button>

        <div className="space-y-3">
          {selectedExercises.map((ex, idx) => (
            <div
              key={`${ex.id}-${idx}`}
              className="bg-bg-surface border border-border-color rounded-4xl p-5 flex flex-col gap-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoveVertical size={16} className="text-text-muted/40" />
                  <span className="text-sm font-black uppercase italic text-text-main">
                    {ex.name}
                  </span>
                </div>
                <button
                  onClick={() => removeExercise(idx)}
                  className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"
                >
                  <Minus size={16} strokeWidth={3} />
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
          disabled={loading || !name || selectedExercises.length === 0}
          className="w-full py-6 bg-brand-primary text-black font-black uppercase italic rounded-4xl shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest mt-4 disabled:opacity-30"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Check size={24} strokeWidth={4} />
          )}
          <span>{loading ? "Creating..." : "Create Template"}</span>
        </button>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onAdd={handleAddExercises}
        />
      )}
    </SubPageLayout>
  );
};

/** SUB-COMPONENTS **/

const PrivacyToggle = ({
  active,
  label,
  icon,
  onClick,
  primary,
}: PrivacyToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
      active
        ? primary
          ? "bg-brand-primary text-black border-brand-primary"
          : "bg-text-main text-bg-main border-text-main"
        : "border-border-color text-text-muted"
    }`}
  >
    {icon} {label}
  </button>
);

const Counter = ({ label, value, onDec, onInc }: CounterProps) => (
  <div className="bg-bg-main/50 border border-border-color rounded-2xl p-3 flex items-center justify-between">
    <span className="text-[9px] font-black uppercase text-text-muted">
      {label}
    </span>
    <div className="flex items-center gap-3 bg-bg-surface p-1 rounded-xl border border-border-color/50">
      <button
        type="button"
        onClick={onDec}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-main active:bg-bg-main transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="text-sm font-black text-text-main tabular-nums min-w-6 text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-main active:bg-bg-main transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);
