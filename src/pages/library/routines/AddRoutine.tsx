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

import type { Routine } from "../../../types/database.types";
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

interface SortableExerciseItemProps {
  ex: SelectedExercise;
  index: number;
  onRemove: () => void;
  onUpdate: (field: TargetMetricKey, val: number) => void;
}

interface PrivacyToggleProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

// --- 2. MAIN COMPONENT ---

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

  return (
    <SubPageLayout title="New Routine">
      <div className="flex-1 flex flex-col gap-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* IDENTITY CARD */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-xl space-y-6 shadow-sm">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ROUTINE NAME"
            className="w-full bg-transparent text-2xl font-black italic text-text-main outline-none uppercase tracking-tighter placeholder:text-text-muted/20"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="NOTES..."
            className="w-full bg-bg-main/50 border border-border-color rounded-xl p-4 text-[11px] font-bold text-text-main outline-none resize-none h-20 placeholder:text-text-muted/40 uppercase tracking-widest"
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
        </div>

        {/* ADD ACTION */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full bg-bg-surface border border-dashed border-border-color rounded-xl py-5 flex items-center justify-center gap-3 text-text-muted active:scale-[0.98] transition-all"
        >
          <Plus size={18} className="text-brand-primary" />
          <span className="text-[11px] font-black uppercase italic tracking-widest">
            Add Exercises
          </span>
        </button>

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

        {/* CREATE BUTTON */}
        <button
          onClick={onSave}
          disabled={loading || !name || selectedExercises.length === 0}
          className="w-full h-14 bg-brand-primary text-bg-main font-black uppercase italic tracking-widest rounded-xl shadow-md shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-30"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Check size={20} strokeWidth={3} />
          )}
          <span>Create Template</span>
        </button>
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

// --- 3. SORTABLE ITEM ---

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
  } = useSortable({
    id: ex.tempId,
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
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-text-muted/30 hover:text-brand-primary transition-colors"
          >
            <GripVertical size={16} />
          </div>
          <div className="w-6 h-6 rounded-lg bg-bg-main border border-border-color flex items-center justify-center text-[10px] font-black italic text-text-muted shrink-0">
            {index + 1}
          </div>
          <span className="text-[13px] font-black uppercase italic text-text-main truncate tracking-tight">
            {ex.name}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg bg-brand-error/10 text-brand-error flex items-center justify-center transition-colors active:scale-90"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m) => {
          const value = ex[m.key] ?? 0;
          return (
            <div key={m.key} className="space-y-1.5 text-center">
              <div className="flex items-center gap-1 justify-center opacity-40">
                {m.icon}
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {m.label}
                </span>
              </div>

              <div className="flex items-center justify-between bg-bg-main border border-border-color rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => onUpdate(m.key, Math.max(0, value - 1))}
                  className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-main active:scale-75 transition-transform"
                >
                  <Minus size={12} />
                </button>

                <span className="text-xs font-black italic text-text-main tabular-nums">
                  {value}
                </span>

                <button
                  type="button"
                  onClick={() => onUpdate(m.key, value + 1)}
                  className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-main active:scale-75 transition-transform"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 4. HELPERS ---

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
