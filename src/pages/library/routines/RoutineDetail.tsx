import {
  useEffect,
  useState,
  useMemo,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Trash2,
  AlertCircle,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import { ExercisePicker } from "../exercises/ExercisePicker";

// 1. Strict Interfaces
import { useAuth } from "../../../hooks/useAuth";

export interface SelectedExercise extends Partial<EnrichedExercise> {
  id: string; // The specific junction ID or a generated local ID
  exercise_id: string;
  name?: string;
  target_sets: number;
  target_reps: number;
}

/**
 * STRICT DATABASE INTERFACE
 * Replaced [key: string]: any with explicit properties to satisfy the linter
 * and the React Compiler's static analysis.
 */
interface RoutineExerciseDB {
  id?: string;
  exercise_id: string;
  name?: string;
  target_sets?: number | null;
  target_reps?: number | null;
  exercise_order?: number;
  is_synced?: number;
}

interface PrivacyProps {
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

export const RoutineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user_id } = useAuth();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [library, setLibrary] = useState<EnrichedExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >([]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!id) return;
      try {
        const [details, fullLibrary] = await Promise.all([
          RoutineService.getRoutineDetail(id),
          LibraryService.getExercisesWithMeta(),
        ]);

        if (isMounted && details) {
          setName(details.name);
          setDescription(details.description || "");
          setIsPublic(details.is_public);

          // MAPPING: Convert DB rows to SelectedExercise objects
          const mapped = details.exercises.map(
            (ex: RoutineExerciseDB): SelectedExercise => ({
              ...ex,
              id: ex.id || ex.exercise_id || crypto.randomUUID(),
              exercise_id: ex.exercise_id,
              target_sets: ex.target_sets ?? 3,
              target_reps: ex.target_reps ?? 10,
            }),
          );

          setSelectedExercises(mapped);
        }
        if (isMounted) setLibrary(fullLibrary);
      } catch (err: unknown) {
        // FIXED: 'err' used for debugging to satisfy linter
        console.error("RoutineDetail Load Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const muscleFocus = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedExercises.forEach((ex: SelectedExercise) => {
      const targetId = ex.exercise_id || ex.id;
      const baseEx = library.find((l) => l.id === targetId);
      baseEx?.all_muscles
        ?.filter((m) => m.role === "primary")
        .forEach((m) => {
          counts[m.name] = (counts[m.name] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [selectedExercises, library]);

  const handleAddExercises = (ids: string[]) => {
    const newItems: SelectedExercise[] = ids.map((exId) => {
      const ex = library.find((l) => l.id === exId);
      return {
        ...(ex || {}),
        id: crypto.randomUUID(),
        exercise_id: exId,
        target_sets: 3,
        target_reps: 10,
      } as SelectedExercise;
    });
    setSelectedExercises((prev) => [...prev, ...newItems]);
    setShowPicker(false);
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

  const onUpdate = async () => {
    if (!id || !user_id || processing) return;
    setProcessing(true);
    try {
      await RoutineService.updateRoutine(
        id,
        {
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        },
        selectedExercises.map((ex: SelectedExercise) => ({
          exercise_id: ex.exercise_id || ex.id,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
        })),
      );
      navigate(-1);
    } catch (err: unknown) {
      console.error("Update failed:", err);
      alert("Error updating routine.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main min-h-screen">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );

  return (
    <SubPageLayout title="Edit Routine">
      <div className="flex-1 flex flex-col gap-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* INFO CARD */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-[2.2rem] shadow-xl space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            className="w-full bg-transparent text-2xl font-black italic text-text-main outline-none uppercase tracking-tighter"
          />

          <textarea
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="ROUTINE DESCRIPTION"
            className="w-full bg-bg-main border border-border-color rounded-2xl p-4 text-xs font-bold text-text-main outline-none resize-none h-24 placeholder:text-text-muted/20"
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

          <div className="flex flex-wrap gap-2">
            {muscleFocus.map(([mName]) => (
              <span
                key={mName}
                className="text-[8px] font-black uppercase px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20"
              >
                {mName}
              </span>
            ))}
          </div>
        </div>

        {/* ADD ACTION */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full bg-bg-surface border border-border-color rounded-2xl py-6 px-6 flex items-center gap-4 text-text-muted active:scale-[0.98] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-bg-main flex items-center justify-center border border-border-color group-hover:border-brand-primary/40 transition-colors">
            <Plus size={18} className="text-brand-primary" />
          </div>
          <span className="text-xs font-black uppercase italic tracking-widest">
            Add Exercises
          </span>
        </button>

        {/* LIST SECTION */}
        <div className="space-y-3">
          {selectedExercises.map((ex: SelectedExercise, idx: number) => (
            <div
              key={`${ex.id}-${idx}`}
              className="bg-bg-surface border border-border-color rounded-[1.8rem] p-5 flex flex-col gap-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoveVertical size={16} className="text-text-muted/40" />
                  <span className="text-sm font-black uppercase italic text-text-main">
                    {ex.name ||
                      library.find((l) => l.id === ex.exercise_id)?.name}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSelectedExercises((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all"
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

        {/* SAVE/DELETE ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            disabled={processing}
            className="w-full py-6 bg-brand-primary text-black font-black uppercase italic rounded-4xl shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Check size={20} strokeWidth={4} />
            )}
            <span>{processing ? "Updating..." : "Update Template"}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-6 bg-red-500/10 text-red-500 font-black uppercase italic rounded-4xl flex items-center justify-center gap-3 border border-red-500/20 active:scale-95 transition-all"
          >
            <Trash2 size={20} /> Archive Routine
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onAdd={handleAddExercises}
        />
      )}

      <ConfirmModal
        isOpen={showModal}
        onConfirm={() => {
          RoutineService.archiveRoutine(id!)
            .then(() => navigate(-1))
            .catch((err: unknown) => console.error("Archive Error:", err));
        }}
        onCancel={() => setShowModal(false)}
      />
    </SubPageLayout>
  );
};

/* --- UI COMPONENTS --- */

const PrivacyToggle = ({
  active,
  label,
  icon,
  onClick,
  primary,
}: PrivacyProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
      active
        ? primary
          ? "bg-brand-primary text-black border-brand-primary shadow-lg shadow-brand-primary/20"
          : "bg-text-main text-bg-main border-text-main shadow-lg"
        : "border-border-color text-text-muted"
    }`}
  >
    {icon} {label}
  </button>
);

const Counter = ({ label, value, onDec, onInc }: CounterProps) => (
  <div className="bg-bg-main/50 border border-border-color rounded-2xl p-3 flex items-center justify-between">
    <span className="text-[9px] font-black uppercase text-text-muted ml-1">
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

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-color rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-2xl font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive <span className="text-red-500">Routine?</span>
        </h3>
        <p className="text-sm font-bold text-text-muted leading-relaxed mb-8 italic">
          This will hide the template from your library.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 shadow-lg shadow-red-500/30"
          >
            Archive Now
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-text-muted font-black uppercase italic text-[10px] tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
