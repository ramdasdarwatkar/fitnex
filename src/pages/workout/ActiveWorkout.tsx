import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useWorkout } from "../../context/WorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../db/database";
import { WorkoutService } from "../../services/WorkoutService";
import { ExercisePicker } from "../library/exercises/ExercisePicker";
import { DateUtils } from "../../util/dateUtils";
import { PersonalRecordService } from "../../services/PersonalRecordService";

export const ActiveWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "live";
  const { user_id } = useAuth();
  const { activeWorkout, activeLogs } = useWorkout();

  // 1. Get Athlete weight
  const athlete = useLiveQuery(() => db.athlete_summary.toCollection().first());
  const userWeight = athlete?.current_weight || 0;

  // 2. Get all exercise definitions to check bodyweight status
  const allExercises = useLiveQuery(() => db.exercises.toArray(), []);

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [newPR, setNewPR] = useState<{ name: string; weight: number } | null>(
    null,
  );

  const istNow = DateUtils.getISTDate();
  const [defaultDateFull] = istNow.split("T");
  const defaultTime = istNow.split("T")[1].substring(0, 5);

  const [pastDate, setPastDate] = useState(defaultDateFull);
  const [pastStart, setPastStart] = useState(defaultTime);
  const [pastEnd, setPastEnd] = useState(defaultTime);

  // --- Volume & Stats Logic Fix ---
  const stats = useMemo(() => {
    const completed = activeLogs.filter((l) => l.completed === 1);

    const totalVolume = completed.reduce((acc, curr) => {
      // Find the exercise definition from the exercise table
      const exDef = allExercises?.find((e) => e.id === curr.exercise_id);

      // Requirement: Check 'bodyweight' field from the exercise table
      const isBW =
        exDef?.bodyweight === 1 ||
        exDef?.bodyweight === true ||
        exDef?.category === "Bodyweight";

      const extraWeight = Number(curr.weight) || 0;
      const reps = Number(curr.reps) || 0;

      // Total = (User BW + Extra) * Reps IF exercise.bodyweight is true
      const effectiveWeight = isBW ? userWeight + extraWeight : extraWeight;

      return acc + effectiveWeight * reps;
    }, 0);

    const totalReps = completed.reduce(
      (acc, curr) => acc + (Number(curr.reps) || 0),
      0,
    );

    return {
      volume: Math.round(totalVolume),
      sets: completed.length,
      reps: totalReps,
    };
  }, [activeLogs, userWeight, allExercises]);

  const triggerHaptic = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const fireConfetti = (intensity: "light" | "heavy") => {
    const duration = intensity === "heavy" ? 3000 : 0;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 600 };

    if (intensity === "light") {
      confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
    } else {
      const interval: any = setInterval(() => {
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
    let interval: any;
    if (restSeconds !== null && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else if (restSeconds === 0) {
      triggerHaptic([150, 50, 150]);
      setRestSeconds(null);
    }
    return () => clearInterval(interval);
  }, [restSeconds]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const sortedLogs = [...activeLogs].sort((a, b) => {
      if (a.exercise_order !== b.exercise_order)
        return a.exercise_order - b.exercise_order;
      return a.set_number - b.set_number;
    });
    sortedLogs.forEach((log: any) => {
      if (!groups[log.exercise_id]) groups[log.exercise_id] = [];
      groups[log.exercise_id].push(log);
    });
    return groups;
  }, [activeLogs]);

  const handleFinishWorkout = async () => {
    let customTimes = undefined;
    if (mode === "past") {
      customTimes = {
        start: `${pastDate}T${pastStart}:00`,
        end: `${pastDate}T${pastEnd}:00`,
      };
    }
    await WorkoutService.finishWorkout(activeWorkout!.id, notes, customTimes);
    navigate("/dashboard");
  };

  if (!activeWorkout && mode === "past") {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    return (
      <SubPageLayout title="Log Previous">
        <div className="flex-1 flex flex-col justify-center items-center py-10 px-6">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
            <h2 className="text-xl font-black uppercase italic text-white text-center tracking-tight">
              Manual Log
            </h2>
            <div className="space-y-4">
              <input
                type="date"
                value={pastDate}
                min={threeWeeksAgo.toISOString().split("T")[0]}
                max={defaultDateFull}
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={pastStart}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
                />
                <input
                  type="time"
                  value={pastEnd}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => user_id && WorkoutService.startNewWorkout(user_id)}
              className="w-full py-5 bg-[var(--brand-primary)] text-black rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"
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
            className="text-red-500/50 active:scale-90 transition-all"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => {
              setShowFinishModal(true);
              fireConfetti("heavy");
              triggerHaptic([100, 50, 100, 50, 400]);
            }}
            className="bg-[var(--brand-primary)] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic active:scale-95 shadow-lg"
          >
            Finish
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-48">
        <div className="flex items-center justify-center gap-2 py-2">
          <Timer
            size={14}
            className="text-[var(--brand-primary)] animate-pulse"
          />
          <span className="text-sm font-black italic text-slate-400 tabular-nums uppercase">
            {mode === "live"
              ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
              : "Manual Log"}
          </span>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedExercises).map(([exId, sets]) => (
            <ExerciseTable
              key={exId}
              exerciseId={exId}
              sets={sets}
              user_id={user_id}
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
          onAdd={(ids: string[]) => {
            WorkoutService.addExercisesToActive(activeWorkout.id, ids);
            setShowPicker(false);
            triggerHaptic(50);
          }}
        />
      )}

      {newPR && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-[var(--brand-primary)] rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mb-6 animate-bounce shadow-xl">
              <Trophy size={40} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase italic text-white mb-2">
              New Record!
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase mb-4">
              {newPR.name}
            </p>
            <div className="text-5xl font-black italic text-[var(--brand-primary)] mb-8">
              {newPR.weight} KG
            </div>
            <button
              onClick={() => setNewPR(null)}
              className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase italic text-xs"
            >
              Awesome
            </button>
          </div>
        </div>
      )}

      {showFinishModal && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mb-4">
                <Trophy size={36} className="text-black" />
              </div>
              <h2 className="text-2xl font-black uppercase italic text-white tracking-tight">
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
              placeholder="How did it feel?"
              className="w-full bg-black border border-slate-800 rounded-3xl p-5 text-xs text-white h-24 mb-8 outline-none focus:border-[var(--brand-primary)] transition-all"
            />
            <button
              onClick={handleFinishWorkout}
              className="w-full py-5 bg-[var(--brand-primary)] text-black rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all"
            >
              Save and Exit
            </button>
          </div>
        </div>
      )}

      {restSeconds !== null && (
        <div className="fixed bottom-28 left-4 right-4 bg-[var(--brand-primary)] rounded-2xl p-4 flex justify-between items-center shadow-2xl z-50 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-4 text-black font-black italic">
            <div className="flex items-center bg-black/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setRestSeconds(Math.max(0, restSeconds - 15))}
                className="px-3 py-2"
              >
                <Minus size={16} />
              </button>
              <div className="w-14 h-10 bg-black rounded-xl flex items-center justify-center text-[var(--brand-primary)] text-lg font-black tabular-nums">
                {restSeconds}s
              </div>
              <button
                onClick={() => setRestSeconds(restSeconds + 15)}
                className="px-3 py-2"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-[10px] uppercase tracking-tighter">
              Resting
            </span>
          </div>
          <button
            onClick={() => setRestSeconds(null)}
            className="p-2 bg-black/10 rounded-full text-black"
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
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </SubPageLayout>
  );
};

const StatCard = ({ icon: Icon, value, label }: any) => (
  <div className="bg-black/40 p-4 rounded-3xl border border-slate-800/50 flex flex-col items-center">
    <Icon size={14} className="text-[var(--brand-primary)] mb-2" />
    <span className="text-lg font-black text-white italic leading-none">
      {value}
    </span>
    <span className="text-[7px] text-slate-500 uppercase font-black mt-2">
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
}: any) => {
  const [collapsed, setCollapsed] = useState(false);
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId));

  const activeCols = useMemo(() => {
    if (!exercise) return [];
    return [
      {
        key: "weight",
        label: "Weight",
        show: exercise.weight === true || exercise.bodyweight === true,
      },
      {
        key: "reps",
        label: "Reps",
        show: exercise.reps === true,
      },
      {
        key: "distance",
        label: "Dist",
        show: exercise.distance === true,
      },
      {
        key: "duration",
        label: "Time",
        show: exercise.duration === true,
      },
    ].filter((c) => c.show);
  }, [exercise]);

  const gridTemplate = `40px repeat(${activeCols.length}, 1fr) 60px`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center group">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3 className="text-sm font-black uppercase italic text-[var(--brand-primary)]">
            {exercise?.name || "Loading..."}
          </h3>
          {collapsed ? (
            <ChevronDown size={14} className="text-slate-600" />
          ) : (
            <ChevronUp size={14} className="text-slate-600" />
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-slate-700 hover:text-red-500 active:scale-90 transition-all p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-1">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              gap: "8px",
            }}
            className="px-1 mb-2 text-center text-[7px] font-black text-slate-600 uppercase tracking-widest"
          >
            <span>Set</span>
            {activeCols.map((col) => (
              <span key={col.key}>{col.label}</span>
            ))}
            <span className="text-right mr-1">Done</span>
          </div>
          {sets.map((set: any, i: number) => (
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
            className="w-full py-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-[9px] font-black uppercase text-slate-500 mt-2 hover:bg-slate-900 transition-all"
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
}: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);

  const handleUpdate = (field: string, val: number | null) =>
    WorkoutService.updateLog({ ...set, [field]: val });

  const handleComplete = async () => {
    const nextVal = set.completed === 1 ? 0 : 1;
    triggerHaptic(30);
    await WorkoutService.updateLog({ ...set, completed: nextVal });
    if (nextVal === 1) {
      onRest();
      if (Number(set.weight) > 0) {
        const isPR = await PersonalRecordService.checkPR(
          user_id,
          exercise.id,
          set.weight,
        );
        if (isPR) {
          fireConfetti();
          triggerHaptic([100, 50, 100, 50, 300]);
          onPR({ name: exercise.name, weight: set.weight });
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
      style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: "8px" }}
      className={`items-center py-2.5 rounded-2xl transition-all duration-300 ${isDeleting ? "opacity-0 -translate-x-full scale-95" : "scale-100 opacity-100"} ${set.completed === 1 ? "bg-green-500/10" : "bg-transparent"}`}
    >
      <span className="text-[11px] font-black text-slate-500 text-center italic">
        {index + 1}
      </span>
      {activeCols.map((col: any) =>
        col.key === "duration" ? (
          <DurationInput
            key={col.key}
            totalSeconds={set.duration}
            onChange={(val) => handleUpdate("duration", val)}
          />
        ) : (
          <NumberInput
            key={col.key}
            value={set[col.key]}
            type={col.key}
            onChange={(v: number | null) => handleUpdate(col.key, v)}
          />
        ),
      )}
      <button
        onClick={handleComplete}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all active:scale-90 ${set.completed === 1 ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-slate-800 text-slate-700"}`}
      >
        <Check size={20} strokeWidth={4} />
      </button>
    </div>
  );
};

const NumberInput = ({ value, type, onChange }: any) => {
  const step = type === "distance" ? 250 : type === "weight" ? 2.5 : 1;
  const incStep = type === "distance" ? 500 : type === "weight" ? 5 : 1;

  const handleDec = () => {
    const next = Math.max(0, (Number(value) || 0) - step);
    onChange(next === 0 ? null : next);
  };
  const handleInc = () => onChange((Number(value) || 0) + incStep);

  const getDisplayValue = () => {
    if (value === null || value === undefined || isNaN(value)) return "";
    return type === "distance" ? (value / 1000).toString() : value.toString();
  };

  return (
    <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 min-h-[52px]">
      <button
        onClick={handleDec}
        className="px-2 h-full text-slate-500 active:text-white"
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
          const val = e.target.value;
          if (val === "") return onChange(null);
          const raw = parseFloat(val);
          if (isNaN(raw)) return;
          onChange(type === "distance" ? raw * 1000 : raw);
        }}
        className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none placeholder:text-slate-700"
      />
      <button
        onClick={handleInc}
        className="px-2 h-full text-slate-500 active:text-white"
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
    <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 min-h-[52px] px-1">
      <button
        onClick={() => onChange(Math.max(0, safeTotal - 60))}
        className="p-1 text-slate-500"
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
            if (isNaN(v)) return;
            const total = v * 60 + (secs || 0);
            onChange(total === 0 ? null : total);
          }}
          className="w-6 bg-transparent text-right text-[12px] font-black text-white outline-none tabular-nums placeholder:text-slate-700"
        />
        <span className="text-slate-600 font-bold">:</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="00"
          value={secs === null ? "" : secs < 10 ? `0${secs}` : secs}
          onChange={(e) => {
            let v = e.target.value === "" ? 0 : parseInt(e.target.value);
            if (isNaN(v)) return;
            if (v > 59) v = 59;
            const total = (mins || 0) * 60 + v;
            onChange(total === 0 ? null : total);
          }}
          className="w-6 bg-transparent text-left text-[12px] font-black text-white outline-none tabular-nums placeholder:text-slate-700"
        />
      </div>
      <button
        onClick={() => onChange(safeTotal + 300)}
        className="p-1 text-[var(--brand-primary)]"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
