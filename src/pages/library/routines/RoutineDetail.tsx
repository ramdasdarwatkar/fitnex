import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { RoutineService } from "../../../services/RoutineService";
import {
  Check,
  Plus,
  Minus,
  AlertCircle,
  Lock,
  Globe,
  Loader2,
  Clock,
  Hash,
  GripVertical,
  X,
  Edit3,
  Trash2,
} from "lucide-react";
import { ExercisePicker } from "../exercises/ExercisePicker";

// DND Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useAuth } from "../../../hooks/useAuth";
import {
  ExerciseService,
  type EnrichedExercise,
} from "../../../services/ExerciseService";

// --- 1. STRICT INTERFACES ---

export interface SelectedExercise extends EnrichedExercise {
  tempId: string;
  target_sets: number;
  target_reps: number;
  target_duration?: number;
}

type TargetMetricKey = "target_sets" | "target_reps" | "target_duration";

// Fixed interface to allow undefined/optional values from the DB
interface RoutineExerciseDB {
  exercise_id: string;
  target_sets?: number | null;
  target_reps?: number | null;
  target_duration?: number | null;
}

interface SortableExerciseItemProps {
  ex: SelectedExercise;
  index: number;
  onRemove: () => void;
  onUpdate: (field: TargetMetricKey, val: number) => void;
  isEditing: boolean;
}

interface PrivacyToggleProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

// --- 2. MAIN COMPONENT ---

export const RoutineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user_id } = useAuth();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [library, setLibrary] = useState<EnrichedExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!id) return;
      try {
        const [details, fullLibrary] = await Promise.all([
          RoutineService.getRoutineDetail(id),
          ExerciseService.getExercisesWithMeta(),
        ]);

        if (isMounted && details) {
          setName(details.name);
          setDescription(details.description || "");
          setIsPublic(details.is_public);

          const mapped = details.exercises.map(
            (ex: RoutineExerciseDB): SelectedExercise => {
              const baseEx = fullLibrary.find((l) => l.id === ex.exercise_id);
              return {
                ...(baseEx || ({} as EnrichedExercise)),
                tempId: crypto.randomUUID(),
                exercise_id: ex.exercise_id,
                target_sets: ex.target_sets ?? 3,
                target_reps: ex.target_reps ?? 10,
                target_duration: ex.target_duration ?? undefined,
              } as SelectedExercise;
            },
          );
          setSelectedExercises(mapped);
        }
        if (isMounted) setLibrary(fullLibrary);
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((i) => i.tempId === active.id);
        const newIndex = items.findIndex((i) => i.tempId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
        selectedExercises.map((ex) => ({
          exercise_id: ex.id,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_duration: ex.target_duration,
        })),
      );
      setIsEditing(false);
    } catch (err) {
      console.error(err);
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
    <SubPageLayout title={isEditing ? "Edit Routine" : "Routine Detail"}>
      <div className="flex-1 flex flex-col gap-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* HEADER CARD */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-xl space-y-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic">
              Routine Title
            </label>
            <input
              disabled={!isEditing}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-2xl font-black italic text-text-main outline-none uppercase tracking-tighter disabled:opacity-100"
            />
          </div>

          <textarea
            disabled={!isEditing}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="NOTES..."
            className="w-full bg-bg-main/50 border border-border-color rounded-xl p-4 text-[11px] font-bold text-text-main outline-none resize-none h-20 placeholder:text-text-muted/40 uppercase tracking-widest disabled:opacity-60"
          />

          <div className="flex gap-2">
            <PrivacyToggle
              active={!isPublic}
              label="Private"
              icon={<Lock size={12} />}
              onClick={() => isEditing && setIsPublic(false)}
            />
            <PrivacyToggle
              active={isPublic}
              label="Public"
              icon={<Globe size={12} />}
              primary
              onClick={() => isEditing && setIsPublic(true)}
            />
          </div>
        </div>

        {isEditing && (
          <button
            onClick={() => setShowPicker(true)}
            className="w-full bg-bg-surface border border-dashed border-border-color rounded-xl py-5 flex items-center justify-center gap-3 text-text-muted active:scale-[0.98] transition-all"
          >
            <Plus size={18} className="text-brand-primary" />
            <span className="text-[11px] font-black uppercase italic tracking-widest">
              Add Exercises
            </span>
          </button>
        )}

        {/* SORTABLE LIST */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedExercises.map((e) => e.tempId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {selectedExercises.map((ex, idx) => (
                <SortableExerciseItem
                  key={ex.tempId}
                  ex={ex}
                  index={idx}
                  isEditing={isEditing}
                  onRemove={() =>
                    setSelectedExercises((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  onUpdate={(field, val) => {
                    setSelectedExercises((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, [field]: val } : item,
                      ),
                    );
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* DYNAMIC ACTION BUTTONS */}
        <div className="flex flex-col gap-3 mt-4">
          {isEditing ? (
            <>
              <button
                onClick={onUpdate}
                disabled={
                  processing || !name.trim() || selectedExercises.length === 0
                }
                className="w-full h-14 bg-brand-primary text-bg-main font-black uppercase italic tracking-widest rounded-xl shadow-md shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {processing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check size={20} strokeWidth={3} />
                )}
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="w-full py-4 bg-bg-surface text-text-muted font-black uppercase italic text-[10px] tracking-widest rounded-xl border border-border-color"
              >
                Discard Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full h-14 bg-text-main text-bg-main font-black uppercase italic tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Edit3 size={18} />
                <span>Modify Routine</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-bg-surface text-brand-error font-black uppercase italic text-[10px] tracking-widest rounded-xl border border-brand-error/20 active:scale-[0.98] transition-all"
              >
                <Trash2 size={16} className="inline mr-2" />
                Archive Routine
              </button>
            </>
          )}
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onAdd={(ids) => {
            const newItems = ids.map((id) => {
              const ex = library.find((l) => l.id === id);
              return {
                ...(ex || {}),
                tempId: crypto.randomUUID(),
                exercise_id: id,
                target_sets: 3,
                target_reps: ex?.reps ? 10 : 0,
                target_duration: ex?.duration ? 30 : undefined,
              } as SelectedExercise;
            });
            setSelectedExercises((prev) => [...prev, ...newItems]);
            setShowPicker(false);
          }}
          excludedIds={selectedExercises.map((e) => e.id)}
        />
      )}

      <ConfirmModal
        isOpen={showModal}
        onConfirm={() =>
          RoutineService.archiveRoutine(id!).then(() => navigate(-1))
        }
        onCancel={() => setShowModal(false)}
      />
    </SubPageLayout>
  );
};

// --- 3. SUB-COMPONENTS ---

const SortableExerciseItem = ({
  ex,
  index,
  onRemove,
  onUpdate,
  isEditing,
}: SortableExerciseItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ex.tempId,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: "relative" as const,
  };

  const metrics = [
    {
      key: "target_sets" as const,
      label: "Sets",
      icon: <Hash size={10} />,
      show: true,
    },
    {
      key: "target_reps" as const,
      label: "Reps",
      icon: <Hash size={10} />,
      show: !!ex.reps,
    },
    {
      key: "target_duration" as const,
      label: "min",
      icon: <Clock size={10} />,
      show: !!ex.duration,
    },
  ].filter((m) => m.show);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-surface border rounded-xl p-4 space-y-4 shadow-sm transition-all ${
        isDragging
          ? "border-brand-primary ring-4 ring-brand-primary/10 shadow-2xl scale-[1.02]"
          : "border-border-color"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {isEditing && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-text-muted/30 hover:text-brand-primary transition-colors"
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className="w-6 h-6 rounded-lg bg-bg-main border border-border-color flex items-center justify-center text-[10px] font-black italic text-text-muted shrink-0">
            {index + 1}
          </div>
          <span className="text-[13px] font-black uppercase italic text-text-main truncate tracking-tight">
            {ex.name}
          </span>
        </div>
        {isEditing && (
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-brand-error/10 text-brand-error flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m) => {
          const val = ex[m.key] ?? 0;
          return (
            <div key={m.key} className="space-y-1.5 text-center">
              <div className="flex items-center gap-1 justify-center opacity-40">
                {m.icon}
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {m.label}
                </span>
              </div>
              <div
                className={`flex items-center justify-between bg-bg-main border border-border-color rounded-xl p-1 ${
                  !isEditing ? "opacity-80" : ""
                }`}
              >
                {isEditing && (
                  <button
                    onClick={() => onUpdate(m.key, Math.max(0, val - 1))}
                    className="w-7 h-7 flex items-center justify-center text-text-muted active:scale-75 transition-transform"
                  >
                    <Minus size={12} />
                  </button>
                )}
                <span
                  className={`text-xs font-black italic text-text-main tabular-nums ${
                    !isEditing ? "w-full py-1.5 text-center" : ""
                  }`}
                >
                  {val}
                </span>
                {isEditing && (
                  <button
                    onClick={() => onUpdate(m.key, val + 1)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted active:scale-75 transition-transform"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic tracking-widest border transition-all flex items-center justify-center gap-2 ${
      active
        ? primary
          ? "bg-brand-primary text-bg-main border-brand-primary shadow-md shadow-brand-primary/10"
          : "bg-text-main text-bg-main border-text-main shadow-sm"
        : "border-border-color text-text-muted opacity-40"
    }`}
  >
    {icon} {label}
  </button>
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
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm animate-in fade-in"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-xs bg-bg-surface border border-border-color rounded-xl p-8 text-center animate-in zoom-in-95 shadow-2xl">
        <AlertCircle className="mx-auto text-brand-error mb-4" size={40} />
        <h3 className="text-xl font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive Routine?
        </h3>
        <p className="text-[11px] font-bold text-text-muted mb-8 leading-relaxed uppercase tracking-wide">
          This template will be hidden from your routine library.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-brand-error text-bg-main rounded-xl font-black uppercase italic tracking-widest active:scale-[0.98] transition-all"
          >
            Confirm Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 text-text-muted font-black uppercase italic text-[10px] tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
