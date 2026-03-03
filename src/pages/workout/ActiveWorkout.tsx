import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import confetti from "canvas-confetti";
import { createPortal } from "react-dom"; // Ensure this is imported
import {
  Timer,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
  Play,
  Trophy,
  Activity,
  Hash,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useWorkout } from "../../hooks/useWorkout";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../db/database";
import { WorkoutService } from "../../services/WorkoutService";
import { ExercisePicker } from "../library/exercises/ExercisePicker";
import { DateUtils } from "../../util/dateUtils";
import { PersonalRecordService } from "../../services/PersonalRecordService";
import { PRCelebration } from "./components/PRCelebration";
import { type LocalWorkoutLog } from "../../types/database.types";
import { WorkoutLogsService } from "../../services/WorkoutLogsService";

// --- TYPE DEFINITIONS ---

type ActiveLog = LocalWorkoutLog;

interface ColumnConfig {
  key: "weight" | "reps" | "distance" | "duration";
  label: string;
  show: boolean;
}

interface WorkoutExercise {
  id: string;
  name: string;
  bodyweight?: boolean | number;
  weight?: boolean;
  reps?: boolean;
  distance?: boolean;
  duration?: boolean;
  category?: string;
}

interface NewPR {
  name: string;
  weight: number;
}

// --- MAIN COMPONENT ---

export const ActiveWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "live";
  const { user_id } = useAuth();
  const { activeWorkout, activeLogs } = useWorkout();

  const athlete = useLiveQuery(() => db.athlete_summary.toCollection().first());
  const userWeight = athlete?.current_weight || 0;
  const allExercises = useLiveQuery(
    () => db.exercises.toArray() as Promise<WorkoutExercise[]>,
    [],
  );

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [newPR, setNewPR] = useState<NewPR | null>(null);

  const istNow = DateUtils.getISTDate();
  const [defaultDateFull] = istNow.split("T");
  const defaultTime = istNow.split("T")[1].substring(0, 5);

  const [pastDate, setPastDate] = useState(defaultDateFull);
  const [pastStart, setPastStart] = useState(defaultTime);
  const [pastEnd, setPastEnd] = useState(defaultTime);

  const isTimerActive = restSeconds !== null;

  const stats = useMemo(() => {
    const completed = activeLogs.filter((l) => l.completed === 1);
    const totalVolume = completed.reduce((acc, curr) => {
      const exDef = allExercises?.find((e) => e.id === curr.exercise_id);
      const isBW = exDef?.bodyweight === true || exDef?.bodyweight === 1;
      const extraWeight = Number(curr.weight) || 0;
      const reps = Number(curr.reps) || 0;
      const effectiveWeight = isBW ? userWeight + extraWeight : extraWeight;
      return acc + effectiveWeight * reps;
    }, 0);

    return {
      volume: Math.round(totalVolume),
      sets: completed.length,
      reps: completed.reduce((acc, curr) => acc + (Number(curr.reps) || 0), 0),
    };
  }, [activeLogs, userWeight, allExercises]);

  const triggerHaptic = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const hapticRef = useRef(triggerHaptic);
  useEffect(() => {
    hapticRef.current = triggerHaptic;
  }, []);

  const fireConfetti = (intensity: "light" | "heavy") => {
    const duration = intensity === "heavy" ? 3000 : 0;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 600 };

    if (intensity === "light") {
      confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
    } else {
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        confetti({
          ...defaults,
          particleCount: 40,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  };

  useEffect(() => {
    if (activeWorkout && mode === "live") {
      const start = new Date(activeWorkout.start_time).getTime();
      const interval = setInterval(() => {
        const now = new Date(DateUtils.getISTDate()).getTime();
        setSeconds(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeWorkout, mode]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isTimerActive) {
      timer = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            hapticRef.current([150, 50, 150]);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerActive]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, ActiveLog[]> = {};
    const sortedLogs = [...activeLogs].sort((a, b) => {
      if (a.exercise_order !== b.exercise_order)
        return a.exercise_order - b.exercise_order;
      return a.set_number - b.set_number;
    });
    sortedLogs.forEach((log) => {
      if (!groups[log.exercise_id]) groups[log.exercise_id] = [];
      groups[log.exercise_id].push(log as ActiveLog);
    });
    return groups;
  }, [activeLogs]);

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;
    let customTimes = undefined;
    if (mode === "past") {
      customTimes = {
        start: `${pastDate}T${pastStart}:00`,
        end: `${pastDate}T${pastEnd}:00`,
      };
    }
    await WorkoutService.finishWorkout(activeWorkout.id, notes, customTimes);
    navigate("/dashboard");
  };

  if (!activeWorkout && mode === "past") {
    return (
      <SubPageLayout title="Log Previous">
        <div className="flex-1 flex flex-col justify-center items-center py-10 px-6 animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-bg-surface border border-border-color p-8 rounded-[2.5rem] space-y-6 card-glow">
            <h2 className="text-xl font-black uppercase italic text-text-main text-center tracking-tight">
              Manual Log
            </h2>
            <div className="space-y-4">
              <input
                type="date"
                value={pastDate}
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none focus:border-brand-primary/50 transition-colors"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={pastStart}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none focus:border-brand-primary/50 transition-colors"
                />
                <input
                  type="time"
                  value={pastEnd}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none focus:border-brand-primary/50 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={() => user_id && WorkoutService.startNewWorkout(user_id)}
              className="w-full py-5 bg-brand-primary rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{
                color: "var(--color-on-brand)",
                boxShadow: "0 4px 24px var(--glow-primary)",
              }}
            >
              <Play size={18} fill="currentColor" /> Start Entry
            </button>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  if (!activeWorkout) return null;

  return (
    <SubPageLayout
      title={mode === "live" ? "Live session" : "Past session"}
      rightElement={
        <div className="flex gap-4 items-center">
          <button
            onClick={() =>
              WorkoutService.discardWorkout(activeWorkout.id).then(() =>
                navigate("/dashboard"),
              )
            }
            className="active:scale-90 transition-all"
            style={{ color: "var(--brand-danger)" }}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => {
              setShowFinishModal(true);
              fireConfetti("heavy");
              triggerHaptic([100, 50, 100, 50, 400]);
            }}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic active:scale-95 transition-all bg-brand-primary"
            style={{
              color: "var(--color-on-brand)",
              boxShadow: "0 2px 12px var(--glow-primary)",
            }}
          >
            Finish
          </button>
        </div>
      }
      footer={
        <div
          className={`flex items-center gap-3 w-full animate-in slide-in-from-bottom duration-500 ${!restSeconds ? "justify-end" : ""}`}
        >
          {/* Rest Timer Toast */}
          {restSeconds !== null && (
            <div
              className="flex-1 h-14 bg-brand-primary rounded-2xl px-3 flex justify-between items-center"
              style={{ boxShadow: "0 8px 24px var(--glow-primary)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-black/20 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setRestSeconds((s) =>
                        s !== null ? Math.max(0, s - 15) : null,
                      )
                    }
                    className="px-2 py-1 text-white active:opacity-70"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="w-10 h-8 flex items-center justify-center text-sm font-black tabular-nums text-white">
                    {restSeconds}s
                  </div>
                  <button
                    onClick={() =>
                      setRestSeconds((s) => (s !== null ? s + 15 : null))
                    }
                    className="px-2 py-1 text-white active:opacity-70"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {/* RESTING TEXT RESTORED HERE */}
                <span className="text-[10px] font-black uppercase italic tracking-widest text-white/90">
                  Resting
                </span>
              </div>
              <button
                onClick={() => setRestSeconds(null)}
                className="p-1.5 rounded-full bg-black/10 text-white active:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Circular FAB */}
          <button
            onClick={() => {
              setShowPicker(true);
              triggerHaptic(30);
            }}
            className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{
              color: "var(--color-on-brand)",
              boxShadow: "0 4px 20px var(--glow-primary)",
            }}
          >
            <Plus size={28} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-center gap-2 py-2">
          <Timer size={14} className="text-brand-primary animate-pulse" />
          <span className="text-sm font-black italic text-text-muted tabular-nums uppercase">
            {mode === "live"
              ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
              : "Manual Log"}
          </span>
        </div>

        <div className="space-y-12">
          {Object.entries(groupedExercises).map(([exId, sets]) => (
            <ExerciseTable
              key={exId}
              exerciseId={exId}
              sets={sets}
              user_id={user_id!}
              onRest={() => mode === "live" && setRestSeconds(60)}
              activeWorkoutId={activeWorkout.id}
              onPR={setNewPR}
              fireConfetti={() => fireConfetti("light")}
              triggerHaptic={triggerHaptic}
              onRemove={() =>
                WorkoutLogsService.removeExerciseFromWorkout(
                  activeWorkout.id,
                  exId,
                )
              }
            />
          ))}
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          excludedIds={Object.keys(groupedExercises)}
          onAdd={(ids) => {
            WorkoutLogsService.addExercisesToActive(activeWorkout.id, ids);
            setShowPicker(false);
            triggerHaptic(50);
          }}
        />
      )}

      {newPR && (
        <PRCelebration
          exerciseName={newPR.name}
          weight={newPR.weight}
          onClose={() => setNewPR(null)}
        />
      )}

      {showFinishModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-bg-main/95 backdrop-blur-sm flex items-end justify-center p-4">
            <div
              className="w-full max-w-md bg-bg-surface border border-border-color rounded-[3.5rem] p-8
                 animate-in slide-in-from-bottom duration-500 card-glow mb-safe"
              onClick={(e) => e.stopPropagation()} // Good practice to prevent accidental closes
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div
                  className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mb-4"
                  style={{ boxShadow: "0 0 24px var(--glow-primary)" }}
                >
                  <Trophy
                    size={36}
                    style={{ color: "var(--color-on-brand)" }}
                  />
                </div>
                <h2 className="text-2xl font-black uppercase italic text-text-main tracking-tight">
                  Workout Complete!
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <StatCard
                  icon={Weight}
                  value={stats.volume}
                  label="Volume"
                  unit="kg"
                />
                <StatCard icon={Hash} value={stats.sets} label="Sets" />
                <StatCard icon={Activity} value={stats.reps} label="Reps" />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session notes..."
                className="w-full bg-bg-main border border-border-color rounded-3xl p-5 text-xs
                   text-text-main h-24 mb-8 outline-none resize-none
                   focus:border-brand-primary/50 transition-colors"
              />

              <button
                onClick={handleFinishWorkout}
                className="w-full py-5 bg-brand-primary rounded-3xl font-black uppercase italic
                   active:scale-95 transition-all"
                style={{
                  color: "var(--color-on-brand)",
                  boxShadow: "0 4px 24px var(--glow-primary)",
                }}
              >
                Save and Exit
              </button>
            </div>
          </div>,
          document.body, // This pushes it to the root body level
        )}
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({
  icon: Icon,
  value,
  label,
  unit,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  unit?: string;
}) => (
  <div className="bg-bg-main p-4 rounded-3xl border border-border-color/50 flex flex-col items-center card-glow">
    <Icon size={16} className="text-brand-primary mb-3" />
    <span className="text-xl font-black text-text-main italic leading-none tabular-nums">
      {value.toLocaleString()}
    </span>
    {unit && (
      <span className="text-[7px] font-black text-text-muted/40 uppercase tracking-widest mt-0.5">
        {unit}
      </span>
    )}
    <span className="text-[8px] text-text-muted/60 uppercase font-black mt-1.5 tracking-widest">
      {label}
    </span>
  </div>
);

const ExerciseTable = ({
  exerciseId,
  sets,
  user_id,
  onRest,
  activeWorkoutId,
  onPR,
  fireConfetti,
  triggerHaptic,
  onRemove,
}: {
  exerciseId: string;
  sets: ActiveLog[];
  user_id: string;
  onRest: () => void;
  activeWorkoutId: string;
  onPR: (pr: NewPR) => void;
  fireConfetti: () => void;
  triggerHaptic: (pattern: number | number[]) => void;
  onRemove: () => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId)) as
    | WorkoutExercise
    | undefined;

  const activeCols = useMemo(() => {
    if (!exercise) return [];
    return [
      {
        key: "weight",
        label: "Weight",
        show: !!(exercise.weight || exercise.bodyweight),
      },
      { key: "reps", label: "Reps", show: !!exercise.reps },
      { key: "distance", label: "Dist", show: !!exercise.distance },
      { key: "duration", label: "Time", show: !!exercise.duration },
    ].filter((c) => c.show) as ColumnConfig[];
  }, [exercise]);

  const gridTemplate = `40px repeat(${activeCols.length}, 1fr) 60px`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center px-1">
        <div
          className="flex items-center gap-3 cursor-pointer group/title"
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3 className="text-sm font-black uppercase italic text-brand-primary group-hover/title:opacity-70 transition-opacity">
            {exercise?.name || "Loading..."}
          </h3>
          {collapsed ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronUp size={14} className="text-text-muted" />
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-2 transition-all active:scale-90"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--brand-danger)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              gap: "10px",
            }}
            className="px-2 mb-2 text-center text-[8px] font-black text-text-muted/50 uppercase tracking-widest"
          >
            <span>Set</span>
            {activeCols.map((col) => (
              <span key={col.key}>{col.label}</span>
            ))}
            <span className="text-right">Done</span>
          </div>

          {sets.map((set, i) => (
            <WorkoutLogRow
              key={set.id}
              set={set}
              index={i}
              exercise={exercise}
              activeCols={activeCols}
              gridTemplate={gridTemplate}
              user_id={user_id}
              onRest={onRest}
              onPR={onPR}
              fireConfetti={fireConfetti}
              triggerHaptic={triggerHaptic}
            />
          ))}

          <button
            onClick={() =>
              WorkoutLogsService.addSet(
                activeWorkoutId,
                exerciseId,
                sets.length + 1,
              )
            }
            className="w-full py-4 border border-dashed border-border-color rounded-2xl
                        text-[9px] font-black uppercase text-text-muted/50 mt-3
                        hover:text-text-muted hover:border-border-color/80
                        transition-all tracking-widest"
          >
            + Add Set
          </button>
        </div>
      )}
    </div>
  );
};

const WorkoutLogRow = ({
  set,
  index,
  exercise,
  activeCols,
  gridTemplate,
  user_id,
  onRest,
  onPR,
  fireConfetti,
  triggerHaptic,
}: {
  set: ActiveLog;
  index: number;
  exercise: WorkoutExercise | undefined;
  activeCols: ColumnConfig[];
  gridTemplate: string;
  user_id: string;
  onRest: () => void;
  onPR: (pr: NewPR) => void;
  fireConfetti: () => void;
  triggerHaptic: (pattern: number | number[]) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);

  const handleUpdate = (field: string, val: number | null) =>
    WorkoutLogsService.updateLog({ ...set, [field]: val } as ActiveLog);

  const handleComplete = async () => {
    if (!exercise) return;
    const nextVal = set.completed === 1 ? 0 : 1;
    triggerHaptic(30);
    await WorkoutLogsService.updateLog({
      ...set,
      completed: nextVal,
    } as ActiveLog);
    if (nextVal === 1) {
      onRest();
      if (Number(set.weight) > 0) {
        const isPR = await PersonalRecordService.checkPR(
          user_id,
          exercise.id,
          set.weight!,
        );
        if (isPR) {
          fireConfetti();
          triggerHaptic([100, 50, 100, 50, 300]);
          onPR({ name: exercise.name, weight: set.weight! });
        }
      }
    }
  };

  return (
    <div
      onTouchStart={(e) => setTouchX(e.targetTouches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX && touchX - e.changedTouches[0].clientX > 70) {
          setIsDeleting(true);
          triggerHaptic(50);
          setTimeout(() => WorkoutLogsService.deleteSet(set.id), 300);
        }
      }}
      style={{
        display: "grid",
        gridTemplateColumns: gridTemplate,
        gap: "10px",
      }}
      className={`items-center py-2 px-1 rounded-2xl transition-all duration-300 ${
        isDeleting
          ? "opacity-0 -translate-x-full scale-95"
          : "scale-100 opacity-100"
      } ${set.completed === 1 ? "bg-brand-primary/10" : "bg-transparent"}`}
    >
      <span className="text-[11px] font-black text-text-muted/40 text-center italic tabular-nums">
        {index + 1}
      </span>

      {activeCols.map((col) => {
        const key = col.key;
        const rawValue = set[key];
        const val: number | null =
          rawValue === undefined || rawValue === null ? null : Number(rawValue);

        return key === "duration" ? (
          <DurationInput
            key={key}
            totalSeconds={val}
            onChange={(v) => handleUpdate("duration", v)}
          />
        ) : (
          <NumberInput
            key={key}
            value={val}
            type={key}
            onChange={(v) => handleUpdate(key, v)}
          />
        );
      })}

      <button
        onClick={handleComplete}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all active:scale-90 ${
          set.completed === 1
            ? "bg-brand-primary"
            : "bg-bg-surface border border-border-color text-text-muted"
        }`}
        style={
          set.completed === 1
            ? {
                color: "var(--color-on-brand)",
                boxShadow: "0 2px 12px var(--glow-primary)",
              }
            : undefined
        }
      >
        <Check size={20} strokeWidth={4} />
      </button>
    </div>
  );
};

const NumberInput = ({
  value,
  type,
  onChange,
}: {
  value: number | null;
  type: string;
  onChange: (v: number | null) => void;
}) => {
  const step = type === "distance" ? 250 : type === "weight" ? 2.5 : 1;
  const incStep = type === "distance" ? 500 : type === "weight" ? 5 : 1;

  const getDisplayValue = () =>
    value === null || isNaN(value)
      ? ""
      : type === "distance"
        ? (value / 1000).toString()
        : value.toString();

  return (
    <div className="flex items-center bg-bg-surface rounded-xl border border-border-color min-h-[52px]">
      <button
        onClick={() => {
          const n = Math.max(0, (Number(value) || 0) - step);
          onChange(n === 0 ? null : n);
        }}
        className="px-2 h-full text-text-muted/60 active:text-text-main transition-colors"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        step="any"
        inputMode="decimal"
        placeholder="-"
        value={getDisplayValue()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(null);
          const r = parseFloat(v);
          if (!isNaN(r)) onChange(type === "distance" ? r * 1000 : r);
        }}
        className="w-full bg-transparent text-center text-[13px] font-black text-text-main outline-none placeholder:text-text-muted/20"
      />
      <button
        onClick={() => onChange((Number(value) || 0) + incStep)}
        className="px-2 h-full text-text-muted/60 active:text-text-main transition-colors"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

const DurationInput = ({
  totalSeconds,
  onChange,
}: {
  totalSeconds: number | null;
  onChange: (val: number | null) => void;
}) => {
  const safeTotal = Number(totalSeconds) || 0;
  const mins = totalSeconds !== null ? Math.floor(safeTotal / 60) : null;
  const secs = totalSeconds !== null ? safeTotal % 60 : null;

  return (
    <div className="flex items-center bg-bg-surface rounded-xl border border-border-color min-h-[52px] px-1">
      <button
        onClick={() => onChange(Math.max(0, safeTotal - 60))}
        className="p-1 text-text-muted/60 active:text-text-main transition-colors"
      >
        <Minus size={12} />
      </button>
      <div className="flex-1 flex items-center justify-center gap-0.5">
        <input
          type="number"
          inputMode="numeric"
          placeholder="-"
          value={mins === null ? "" : mins}
          onChange={(e) => {
            const v = e.target.value === "" ? 0 : parseInt(e.target.value);
            if (!isNaN(v)) {
              const t = v * 60 + (secs || 0);
              onChange(t === 0 ? null : t);
            }
          }}
          className="w-6 bg-transparent text-right text-[12px] font-black text-text-main outline-none tabular-nums"
        />
        <span className="text-text-muted/40 font-bold">:</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="00"
          value={secs === null ? "" : secs < 10 ? `0${secs}` : secs}
          onChange={(e) => {
            let v = e.target.value === "" ? 0 : parseInt(e.target.value);
            if (!isNaN(v)) {
              if (v > 59) v = 59;
              const t = (mins || 0) * 60 + v;
              onChange(t === 0 ? null : t);
            }
          }}
          className="w-6 bg-transparent text-left text-[12px] font-black text-text-main outline-none tabular-nums"
        />
      </div>
      <button
        onClick={() => onChange(safeTotal + 300)}
        className="p-1 text-brand-primary active:opacity-70 transition-opacity"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
