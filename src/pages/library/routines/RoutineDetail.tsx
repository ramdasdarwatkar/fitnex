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

// --- TYPES ---

export interface SelectedExercise extends EnrichedExercise {
  tempId: string;
  target_sets: number;
  target_reps: number;
  target_duration?: number;
}

type TargetMetricKey = "target_sets" | "target_reps" | "target_duration";

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

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// --- MAIN COMPONENT ---

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  // Footer varies by editing state
  const footer = isEditing ? (
    <div className="flex flex-col gap-3">
      <button
        onClick={onUpdate}
        disabled={processing || !name.trim() || selectedExercises.length === 0}
        className="w-full h-16 bg-brand-primary rounded-2xl font-black uppercase italic
                   tracking-[0.3em] active:scale-[0.98] transition-all
                   flex items-center justify-center gap-3 disabled:opacity-30"
        style={{
          color: "var(--color-on-brand)",
          boxShadow: "0 4px 24px var(--glow-primary)",
        }}
      >
        {processing ? (
          <Loader2 className="animate-spin" size={22} />
        ) : (
          <Check size={22} strokeWidth={3.5} />
        )}
        <span>Save Changes</span>
      </button>
      <button
        onClick={() => setIsEditing(false)}
        className="w-full py-4 bg-bg-surface text-text-muted/60 font-black uppercase italic
                   text-[10px] tracking-[0.3em] rounded-2xl border border-border-color/40
                   active:scale-[0.98] transition-all"
      >
        Discard
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setIsEditing(true)}
        className="w-full h-16 bg-bg-surface border border-border-color/40 rounded-2xl
                   font-black uppercase italic tracking-[0.3em] card-glow
                   text-text-main active:scale-[0.98] transition-all
                   flex items-center justify-center gap-3
                   hover:border-brand-primary/30 hover:text-brand-primary"
      >
        <Edit3 size={20} />
        <span>Modify Routine</span>
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-4 rounded-2xl font-black uppercase italic text-[10px]
                   tracking-[0.3em] active:scale-[0.98] transition-all
                   flex items-center justify-center gap-2"
        style={{
          color: "var(--brand-danger)",
          background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)",
        }}
      >
        <Trash2 size={15} />
        <span>Archive Routine</span>
      </button>
    </div>
  );

  return (
    <SubPageLayout
      title={isEditing ? "Modify Routine" : "Routine Detail"}
      footer={footer}
    >
      <div className="flex flex-col gap-6 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ── IDENTITY CARD ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 space-y-5 card-glow">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase italic tracking-[0.3em] text-text-muted/50">
              Routine Name
            </p>
            <input
              disabled={!isEditing}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-3xl font-black italic text-text-main
                         outline-none uppercase tracking-tighter
                         disabled:opacity-100 transition-colors
                         focus:text-brand-primary"
            />
          </div>

          <textarea
            disabled={!isEditing}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes..."
            className="w-full bg-bg-main/40 border border-border-color/40 rounded-xl p-4
                       text-[12px] font-black text-text-main outline-none resize-none h-20
                       placeholder:text-text-muted/20 uppercase tracking-widest leading-relaxed
                       disabled:opacity-60 focus:border-brand-primary/30 transition-colors"
          />

          {/* Visibility toggle */}
          <div
            className={`flex bg-bg-main p-1 rounded-xl border border-border-color/40 relative
                        ${!isEditing ? "opacity-60 pointer-events-none" : ""}`}
          >
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-surface rounded-lg
                          border border-border-color/40 transition-all duration-300 ease-out
                          ${isPublic ? "translate-x-[calc(100%+4px)]" : "translate-x-0"}`}
            />
            {[
              { value: false, label: "Private", icon: <Lock size={12} /> },
              { value: true, label: "Public", icon: <Globe size={12} /> },
            ].map(({ value, label, icon }) => {
              const isActive = isPublic === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(value)}
                  className={`flex-1 py-3 z-10 flex items-center justify-center gap-2
                              text-[10px] font-black uppercase italic tracking-widest
                              transition-colors duration-200
                              ${
                                isActive
                                  ? value
                                    ? "text-brand-primary"
                                    : "text-text-main"
                                  : "text-text-muted/40"
                              }`}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ADD BUTTON (edit mode only) ── */}
        {isEditing && (
          <button
            onClick={() => setShowPicker(true)}
            className="w-full bg-bg-surface border-2 border-dashed border-border-color/40
                       rounded-2xl py-5 flex items-center justify-center gap-3
                       text-text-muted/40 hover:text-brand-primary hover:border-brand-primary/40
                       active:scale-[0.98] transition-all"
          >
            <Plus size={18} className="text-brand-primary animate-pulse" />
            <span className="text-[11px] font-black uppercase italic tracking-[0.3em]">
              Add Exercises
            </span>
          </button>
        )}

        {/* ── SORTABLE LIST ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedExercises.map((e) => e.tempId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
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
                  onUpdate={(field, val) =>
                    setSelectedExercises((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, [field]: val } : item,
                      ),
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onAdd={(ids) => {
            const newItems = ids.map((eid) => {
              const ex = library.find((l) => l.id === eid);
              return {
                ...(ex || {}),
                tempId: crypto.randomUUID(),
                exercise_id: eid,
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

// --- SORTABLE ITEM ---

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
  } = useSortable({ id: ex.tempId, disabled: !isEditing });

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: "relative" as const,
  };

  const dragStyle = isDragging
    ? { ...baseStyle, boxShadow: "0 8px 32px var(--glow-primary)" }
    : baseStyle;

  const metrics = [
    {
      key: "target_sets" as const,
      label: "Sets",
      icon: <Hash size={11} />,
      show: true,
    },
    {
      key: "target_reps" as const,
      label: "Reps",
      icon: <Hash size={11} />,
      show: !!ex.reps,
    },
    {
      key: "target_duration" as const,
      label: "Min",
      icon: <Clock size={11} />,
      show: !!ex.duration,
    },
  ].filter((m) => m.show);

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`bg-bg-surface border rounded-2xl p-5 space-y-4 transition-all duration-200
                  ${
                    isDragging
                      ? "border-brand-primary/60 scale-[1.02]"
                      : "border-border-color/40 card-glow"
                  }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {isEditing && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-bg-main
                         border border-border-color/20 text-text-muted/40
                         hover:text-brand-primary transition-colors shrink-0"
            >
              <GripVertical size={15} />
            </div>
          )}
          <div
            className="w-6 h-6 rounded-lg bg-bg-main border border-border-color/40
                          flex items-center justify-center text-[10px] font-black italic
                          text-brand-primary/60 shrink-0"
          >
            {index + 1}
          </div>
          <span className="text-[13px] font-black uppercase italic text-text-main truncate tracking-tight">
            {ex.name}
          </span>
        </div>

        {isEditing && (
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       active:scale-90 transition-all shrink-0 ml-2"
            style={{
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              color: "var(--brand-danger)",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Metric steppers */}
      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m) => {
          const val = ex[m.key] ?? 0;
          return (
            <div key={m.key} className="space-y-2 text-center">
              <div className="flex items-center gap-1.5 justify-center text-text-muted/40 uppercase italic">
                {m.icon}
                <span className="text-[9px] font-black tracking-widest">
                  {m.label}
                </span>
              </div>
              <div
                className="flex items-center justify-between bg-bg-main border border-border-color/40
                              rounded-xl p-1"
              >
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => onUpdate(m.key, Math.max(0, val - 1))}
                    className="w-8 h-8 flex items-center justify-center text-text-muted/50
                               hover:text-text-main active:scale-75 transition-transform"
                  >
                    <Minus size={13} />
                  </button>
                ) : (
                  <div className="w-2" />
                )}

                <span className="text-[13px] font-black italic text-text-main tabular-nums">
                  {val}
                </span>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => onUpdate(m.key, val + 1)}
                    className="w-8 h-8 flex items-center justify-center text-text-muted/50
                               hover:text-text-main active:scale-75 transition-transform"
                  >
                    <Plus size={13} />
                  </button>
                ) : (
                  <div className="w-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- CONFIRM MODAL ---

const ConfirmModal = ({ isOpen, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-xs bg-bg-surface border border-border-color/40
                   rounded-2xl p-8 text-center card-glow animate-in zoom-in-95 duration-200"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--brand-danger)",
          }}
        >
          <AlertCircle size={22} />
        </div>

        <h3 className="text-lg font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive Routine?
        </h3>
        <p
          className="text-[11px] font-black italic text-text-muted/60 mb-8
                      leading-relaxed uppercase tracking-[0.2em]"
        >
          The library entry will be hidden.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl font-black uppercase italic
                       tracking-widest active:scale-[0.98] transition-all"
            style={{
              background: "var(--brand-danger)",
              color: "var(--color-on-brand)",
              boxShadow: "0 4px 16px var(--danger-border)",
            }}
          >
            Confirm Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-text-muted/50 font-black uppercase italic
                       text-[10px] tracking-widest hover:text-text-main transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
