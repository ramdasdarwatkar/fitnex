import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import confetti from "canvas-confetti";
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
import { type LocalWorkoutLog } from "../../types/database.types";

// --- 1. STRICT TYPE DEFINITIONS ---

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

// --- 2. MAIN COMPONENT ---

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

  // Variable for the dependency array to satisfy "Complex Expression" warning
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
          <div className="w-full max-w-sm bg-bg-surface border border-border-color p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
            <h2 className="text-xl font-black uppercase italic text-text-main text-center tracking-tight">
              Manual Log
            </h2>
            <div className="space-y-4">
              <input
                type="date"
                value={pastDate}
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={pastStart}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none"
                />
                <input
                  type="time"
                  value={pastEnd}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="w-full bg-bg-main border border-border-color p-4 rounded-2xl text-text-main font-black outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => user_id && WorkoutService.startNewWorkout(user_id)}
              className="w-full py-5 bg-brand-primary text-bg-main rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"
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
            className="text-brand-danger/50 active:scale-90 transition-all"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => {
              setShowFinishModal(true);
              fireConfetti("heavy");
              triggerHaptic([100, 50, 100, 50, 400]);
            }}
            className="bg-brand-primary text-bg-main px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic active:scale-95 shadow-lg"
          >
            Finish
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-48 animate-in fade-in duration-500">
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
                WorkoutService.deleteExercise(activeWorkout.id, exId)
              }
            />
          ))}
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onAdd={(ids) => {
            WorkoutService.addExercisesToActive(activeWorkout.id, ids);
            setShowPicker(false);
            triggerHaptic(50);
          }}
        />
      )}

      {/* PR MODAL */}
      {newPR && (
        <div className="fixed inset-0 z-500 flex items-center justify-center p-6 bg-bg-main/80 backdrop-blur-sm">
          <div className="bg-bg-surface border-2 border-brand-primary rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mb-6 animate-bounce shadow-xl">
              <Trophy size={40} className="text-bg-main" />
            </div>
            <h2 className="text-2xl font-black uppercase italic text-text-main mb-2">
              New Record!
            </h2>
            <p className="text-text-muted text-[10px] font-black uppercase mb-4">
              {newPR.name}
            </p>
            <div className="text-5xl font-black italic text-brand-primary mb-8">
              {newPR.weight} KG
            </div>
            <button
              onClick={() => setNewPR(null)}
              className="px-10 py-4 bg-text-main text-bg-main rounded-2xl font-black uppercase italic text-xs"
            >
              Awesome
            </button>
          </div>
        </div>
      )}

      {/* FINISH MODAL */}
      {showFinishModal && (
        <div className="fixed inset-0 z-400 bg-bg-main/95 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-bg-surface border border-border-color rounded-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mb-4">
                <Trophy size={36} className="text-bg-main" />
              </div>
              <h2 className="text-2xl font-black uppercase italic text-text-main tracking-tight">
                Workout Complete!
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <StatCard icon={Weight} value={stats.volume} label="Volume" />
              <StatCard icon={Hash} value={stats.sets} label="Sets" />
              <StatCard icon={Activity} value={stats.reps} label="Reps" />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes..."
              className="w-full bg-bg-main border border-border-color rounded-3xl p-5 text-xs text-text-main h-24 mb-8 outline-none focus:border-brand-primary transition-all"
            />
            <button
              onClick={handleFinishWorkout}
              className="w-full py-6 bg-brand-primary text-bg-main rounded-4xl font-black uppercase italic shadow-xl active:scale-95 transition-all"
            >
              Save and Exit
            </button>
          </div>
        </div>
      )}

      {/* REST TIMER TOAST */}
      {restSeconds !== null && (
        <div className="fixed bottom-28 left-6 right-6 bg-brand-primary rounded-2xl p-4 flex justify-between items-center shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-4 text-bg-main font-black italic">
            <div className="flex items-center bg-bg-main/20 rounded-xl overflow-hidden">
              <button
                onClick={() =>
                  setRestSeconds((s) =>
                    s !== null ? Math.max(0, s - 15) : null,
                  )
                }
                className="px-3 py-2"
              >
                <Minus size={16} />
              </button>
              <div className="w-14 h-10 bg-bg-main rounded-xl flex items-center justify-center text-brand-primary text-lg font-black tabular-nums">
                {restSeconds}s
              </div>
              <button
                onClick={() =>
                  setRestSeconds((s) => (s !== null ? s + 15 : null))
                }
                className="px-3 py-2"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-[10px] uppercase tracking-widest">
              Resting
            </span>
          </div>
          <button
            onClick={() => setRestSeconds(null)}
            className="p-2 bg-bg-main/10 rounded-full text-bg-main"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="fixed bottom-10 right-6 z-40">
        <button
          onClick={() => {
            setShowPicker(true);
            triggerHaptic(30);
          }}
          className="w-14 h-14 bg-text-main text-bg-main rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) => (
  <div className="bg-bg-main p-5 rounded-3xl border border-border-color/50 flex flex-col items-center shadow-sm">
    <Icon size={16} className="text-brand-primary mb-3" />
    <span className="text-xl font-black text-text-main italic leading-none tabular-nums">
      {value}
    </span>
    <span className="text-[8px] text-text-muted uppercase font-black mt-2 tracking-widest">
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
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3 className="text-sm font-black uppercase italic text-brand-primary group-hover:opacity-80 transition-opacity">
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
          className="text-text-muted hover:text-brand-danger active:scale-90 transition-all p-2"
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
            className="px-2 mb-2 text-center text-[8px] font-black text-text-muted uppercase tracking-widest opacity-50"
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
              WorkoutService.addSet(
                activeWorkoutId,
                exerciseId,
                sets.length + 1,
              )
            }
            className="w-full py-4 bg-bg-surface/30 border border-dashed border-border-color rounded-2xl text-[9px] font-black uppercase text-text-muted mt-3 hover:bg-bg-surface transition-all tracking-widest"
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
    WorkoutService.updateLog({ ...set, [field]: val } as ActiveLog);

  const handleComplete = async () => {
    if (!exercise) return;
    const nextVal = set.completed === 1 ? 0 : 1;
    triggerHaptic(30);
    await WorkoutService.updateLog({ ...set, completed: nextVal } as ActiveLog);
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
          setTimeout(() => WorkoutService.deleteSet(set.id), 300);
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
      } ${set.completed === 1 ? "bg-brand-success/10" : "bg-transparent"}`}
    >
      <span className="text-[11px] font-black text-text-muted text-center italic opacity-40">
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
            ? "bg-brand-primary text-bg-main shadow-lg shadow-brand-primary/20"
            : "bg-bg-surface border border-border-color text-text-muted"
        }`}
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
    <div className="flex items-center bg-bg-surface rounded-xl border border-border-color min-h-13">
      <button
        onClick={() => {
          const n = Math.max(0, (Number(value) || 0) - step);
          onChange(n === 0 ? null : n);
        }}
        className="px-2 h-full text-text-muted active:text-text-main"
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
        className="px-2 h-full text-text-muted active:text-text-main"
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
    <div className="flex items-center bg-bg-surface rounded-xl border border-border-color min-h-13 px-1">
      <button
        onClick={() => onChange(Math.max(0, safeTotal - 60))}
        className="p-1 text-text-muted"
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
        className="p-1 text-brand-primary"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
