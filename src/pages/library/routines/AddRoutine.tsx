import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { RoutineService } from "../../../services/RoutineService";
import {
  Check,
  Plus,
  Minus,
  Lock,
  Globe,
  Loader2,
  Clock,
  Hash,
  GripVertical,
  X,
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

import type { Routine } from "../../../types/database.types";
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

interface SortableExerciseItemProps {
  ex: SelectedExercise;
  index: number;
  onRemove: () => void;
  onUpdate: (field: TargetMetricKey, val: number) => void;
}

// --- MAIN COMPONENT ---

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    ExerciseService.getExercisesWithMeta().then(setLibrary);
  }, []);

  const handleAddExercises = (ids: string[]) => {
    const newItems: SelectedExercise[] = ids.map((id) => {
      const ex = library.find((l) => l.id === id);
      return {
        ...(ex || ({} as EnrichedExercise)),
        tempId: crypto.randomUUID(),
        target_sets: 3,
        target_reps: ex?.reps ? 10 : 0,
        target_duration: ex?.duration ? 30 : undefined,
      } as SelectedExercise;
    });
    setSelectedExercises((prev) => [...prev, ...newItems]);
    setShowPicker(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((i) => i.tempId === active.id);
        const newIndex = items.findIndex((i) => i.tempId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onSave = async () => {
    if (!name.trim() || !user_id || selectedExercises.length === 0 || loading)
      return;
    setLoading(true);
    try {
      const routinePayload: Routine = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
        created_by: user_id,
        status: true,
        updated_at: new Date().toISOString(),
      };
      await RoutineService.addRoutine(routinePayload, selectedExercises);
      navigate(-1);
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveButton = (
    <button
      onClick={onSave}
      disabled={loading || !name || selectedExercises.length === 0}
      className="w-full h-16 bg-brand-primary rounded-2xl font-black uppercase italic
                 tracking-[0.3em] active:scale-[0.98] transition-all
                 flex items-center justify-center gap-3 disabled:opacity-30"
      style={{
        color: "var(--color-on-brand)",
        boxShadow: "0 4px 24px var(--glow-primary)",
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <Check size={22} strokeWidth={3.5} />
      )}
      <span>Save Routine</span>
    </button>
  );

  return (
    <SubPageLayout title="New Routine" footer={saveButton}>
      <div className="flex flex-col gap-6 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ── IDENTITY CARD ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 space-y-5 card-glow">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Routine name"
            className="w-full bg-transparent text-3xl font-black italic text-text-main outline-none
                       uppercase tracking-tighter placeholder:text-text-muted/15"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes (optional)..."
            className="w-full bg-bg-main/40 border border-border-color/40 rounded-xl p-4
                       text-[12px] font-black text-text-main outline-none resize-none h-20
                       placeholder:text-text-muted/20 uppercase tracking-widest leading-relaxed
                       focus:border-brand-primary/30 transition-colors"
          />

          {/* Visibility toggle */}
          <div className="flex bg-bg-main p-1 rounded-xl border border-border-color/40 relative gap-0">
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

        {/* ── ADD EXERCISES BUTTON ── */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full bg-bg-surface border-2 border-dashed border-border-color/40 rounded-2xl
                     py-5 flex items-center justify-center gap-3
                     text-text-muted/40 hover:text-brand-primary hover:border-brand-primary/40
                     active:scale-[0.98] transition-all"
        >
          <Plus size={18} className="text-brand-primary animate-pulse" />
          <span className="text-[11px] font-black uppercase italic tracking-[0.3em]">
            Add Exercises
          </span>
        </button>

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
          onAdd={handleAddExercises}
          excludedIds={selectedExercises.map((e) => e.id)}
        />
      )}
    </SubPageLayout>
  );
};

// --- SORTABLE ITEM ---

const SortableExerciseItem = ({
  ex,
  index,
  onRemove,
  onUpdate,
}: SortableExerciseItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex.tempId });

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
      style={style}
      className={`bg-bg-surface border rounded-2xl p-5 space-y-4 transition-all duration-200
                  ${
                    isDragging
                      ? "border-brand-primary/60 scale-[1.02]"
                      : "border-border-color/40 card-glow"
                  }`}
      {...(isDragging
        ? {
            style: {
              ...style,
              boxShadow: "0 8px 32px var(--glow-primary)",
            },
          }
        : {})}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-bg-main
                       border border-border-color/20 text-text-muted/40
                       hover:text-brand-primary transition-colors shrink-0"
          >
            <GripVertical size={15} />
          </div>

          {/* Index badge */}
          <div
            className="w-6 h-6 rounded-lg bg-bg-main border border-border-color/40
                          flex items-center justify-center text-[10px] font-black italic
                          text-brand-primary/60 shrink-0"
          >
            {index + 1}
          </div>

          <span
            className="text-[13px] font-black uppercase italic text-text-main
                           truncate tracking-tight"
          >
            {ex.name}
          </span>
        </div>

        {/* Remove button */}
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
      </div>

      {/* Metric steppers */}
      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m) => {
          const value = ex[m.key] ?? 0;
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
                <button
                  type="button"
                  onClick={() => onUpdate(m.key, Math.max(0, value - 1))}
                  className="w-8 h-8 flex items-center justify-center text-text-muted/50
                             hover:text-text-main active:scale-75 transition-transform"
                >
                  <Minus size={13} />
                </button>
                <span className="text-[13px] font-black italic text-text-main tabular-nums">
                  {value}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdate(m.key, value + 1)}
                  className="w-8 h-8 flex items-center justify-center text-text-muted/50
                             hover:text-text-main active:scale-75 transition-transform"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
