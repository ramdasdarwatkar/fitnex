import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
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

export const ActiveWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "live";
  const { user_id } = useAuth();
  const { activeWorkout, activeLogs } = useWorkout();

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [newPR, setNewPR] = useState<{ name: string; weight: number } | null>(
    null,
  );

  const istNow = DateUtils.getISTDate();
  const [defaultDateFull, defaultFullTime] = istNow.split("T");
  const defaultTime = defaultFullTime.substring(0, 5);

  const [pastDate, setPastDate] = useState(defaultDateFull);
  const [pastStart, setPastStart] = useState(defaultTime);
  const [pastEnd, setPastEnd] = useState(defaultTime);

  // --- Summary Calculations ---
  const stats = useMemo(() => {
    const completed = activeLogs.filter((l) => l.completed === 1);
    const volume = completed.reduce(
      (acc, curr) => acc + (curr.weight || 0) * (curr.reps || 0),
      0,
    );
    const totalReps = completed.reduce(
      (acc, curr) => acc + (curr.reps || 0),
      0,
    );
    const duration = mode === "live" ? `${Math.floor(seconds / 60)}m` : "Past";

    return { volume, sets: completed.length, reps: totalReps, duration };
  }, [activeLogs, seconds, mode]);

  // --- Haptics & Celebrations ---
  const triggerHaptic = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const fireConfetti = (intensity: "light" | "heavy") => {
    const duration = intensity === "heavy" ? 3 * 1000 : 0;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 400 };

    if (intensity === "light") {
      confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
    } else {
      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  };

  const playBeep = () => {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
    triggerHaptic([150, 50, 150]);
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
      playBeep();
      setRestSeconds(null);
    }
    return () => clearInterval(interval);
  }, [restSeconds]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, any[]> = {};
    activeLogs.forEach((log: any) => {
      if (!groups[log.exercise_id]) groups[log.exercise_id] = [];
      groups[log.exercise_id].push(log);
    });
    return groups;
  }, [activeLogs]);

  const handleFinishWorkout = async () => {
    const times =
      mode === "past"
        ? {
            start: `${pastDate}T${pastStart}:00`,
            end: `${pastDate}T${pastEnd}:00`,
          }
        : undefined;

    await WorkoutService.finishWorkout(activeWorkout!.id, notes, times);
    navigate("/dashboard");
  };

  if (!activeWorkout && mode === "past") {
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
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={pastStart}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
                />
                <input
                  type="time"
                  value={pastEnd}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="bg-black border border-slate-800 p-4 rounded-2xl text-white font-black outline-none"
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
            className="text-red-500/50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => {
              setShowFinishModal(true);
              fireConfetti("heavy");
              triggerHaptic([100, 50, 100, 50, 400]);
            }}
            className="bg-[var(--brand-primary)] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic active:scale-95 shadow-sm"
          >
            Finish
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-48">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.2rem]">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">
              {mode === "live" ? "Duration" : "Logged on"}
            </span>
            <div className="text-2xl font-black italic text-[var(--brand-primary)] tabular-nums flex items-center gap-2">
              {mode === "live" ? (
                <>
                  <Timer size={18} className="animate-pulse" />
                  {Math.floor(seconds / 60)}m {seconds % 60}s
                </>
              ) : (
                <span className="text-sm text-white">
                  {format(new Date(pastDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
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

      {/* PR Celebration Overlay */}
      {newPR && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-[var(--brand-primary)] rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Trophy size={40} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase italic text-white mb-2 tracking-tight">
              New Record!
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
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

      {/* Finish Workout Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(204,255,0,0.2)]">
                <Trophy size={36} className="text-black" />
              </div>
              <h2 className="text-2xl font-black uppercase italic text-white italic tracking-tight">
                Workout Complete!
              </h2>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                Excellent Performance
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-black/40 p-4 rounded-3xl border border-slate-800/50 flex flex-col items-center">
                <Weight
                  size={14}
                  className="text-[var(--brand-primary)] mb-2"
                />
                <span className="text-lg font-black text-white italic leading-none">
                  {stats.volume}
                </span>
                <span className="text-[7px] text-slate-500 uppercase font-black mt-2">
                  Volume
                </span>
              </div>
              <div className="bg-black/40 p-4 rounded-3xl border border-slate-800/50 flex flex-col items-center">
                <Hash size={14} className="text-[var(--brand-primary)] mb-2" />
                <span className="text-lg font-black text-white italic leading-none">
                  {stats.sets}
                </span>
                <span className="text-[7px] text-slate-500 uppercase font-black mt-2">
                  Sets
                </span>
              </div>
              <div className="bg-black/40 p-4 rounded-3xl border border-slate-800/50 flex flex-col items-center">
                <Activity
                  size={14}
                  className="text-[var(--brand-primary)] mb-2"
                />
                <span className="text-lg font-black text-white italic leading-none">
                  {stats.reps}
                </span>
                <span className="text-[7px] text-slate-500 uppercase font-black mt-2">
                  Reps
                </span>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this session..."
              className="w-full bg-black border border-slate-800 rounded-3xl p-5 text-xs text-white h-24 mb-8 outline-none focus:border-[var(--brand-primary)] transition-colors"
            />

            <button
              onClick={handleFinishWorkout}
              className="w-full py-5 bg-[var(--brand-primary)] text-black rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all"
            >
              Save and Exit
            </button>
          </div>
        </div>
      )}

      {/* Rest Timer Banner */}
      {restSeconds !== null && (
        <div className="fixed bottom-28 left-4 right-4 bg-[var(--brand-primary)] rounded-2xl p-4 flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom z-50">
          <div className="flex items-center gap-4 text-black font-black italic">
            <div className="flex items-center bg-black/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setRestSeconds(Math.max(0, restSeconds - 15))}
                className="px-3 py-2"
              >
                <Minus size={16} />
              </button>
              <div className="w-14 h-10 bg-black rounded-xl flex items-center justify-center text-[var(--brand-primary)] text-lg tabular-nums">
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
          onClick={() => setShowPicker(true)}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </SubPageLayout>
  );
};

// ... ExerciseTable and WorkoutLogRow remain the same as previous full version ...

const ExerciseTable = ({
  exerciseId,
  sets,
  user_id,
  onRest,
  activeWorkoutId,
  onPR,
  fireConfetti,
  triggerHaptic,
}: any) => {
  const [collapsed, setCollapsed] = useState(false);
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center relative">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3 className="text-sm font-black uppercase italic text-[var(--brand-primary)] leading-tight">
            {exercise?.name || "Loading..."}
          </h3>
          {collapsed ? (
            <ChevronDown size={14} className="text-slate-600" />
          ) : (
            <ChevronUp size={14} className="text-slate-600" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-1">
          <div className="grid grid-cols-[30px_1fr_1fr_55px] gap-2 px-1 mb-2 items-center text-center">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
              Set
            </span>
            {exercise?.weight && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                Weight
              </span>
            )}
            {exercise?.reps && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                Reps
              </span>
            )}
            {exercise?.duration && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                Min:Sec
              </span>
            )}
            <span className="text-[7px] font-black text-slate-600 uppercase text-right mr-1">
              Done
            </span>
          </div>

          {sets.map((set: any, i: number) => (
            <WorkoutLogRow
              key={set.id}
              set={set}
              index={i}
              exercise={exercise}
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
            className="w-full py-3 bg-slate-900/40 rounded-xl text-[10px] font-black uppercase text-slate-500 mt-2"
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
  user_id,
  onRest,
  onPR,
  fireConfetti,
  triggerHaptic,
}: any) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd > 70) {
      triggerHaptic(50);
      setIsDeleting(true);
      setTimeout(() => WorkoutService.deleteSet(set.id), 300);
    }
  };

  const handleComplete = async () => {
    const nextVal = set.completed === 1 ? 0 : 1;
    triggerHaptic(30);
    await WorkoutService.updateLog({ ...set, completed: nextVal });

    if (nextVal === 1) {
      onRest();
      if (exercise?.weight && set.weight > 0) {
        const isPR = await WorkoutService.checkPR(
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

  const mins = Math.floor((set.duration || 0) / 60);
  const secs = (set.duration || 0) % 60;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`grid grid-cols-[30px_1fr_1fr_55px] gap-2 items-center py-2.5 rounded-2xl transition-all duration-300 ${isDeleting ? "opacity-0 -translate-x-full" : "opacity-100 translate-x-0"} ${set.completed === 1 ? "bg-green-500/10" : "bg-transparent"}`}
    >
      <span className="text-[11px] font-black text-slate-500 text-center">
        {index + 1}
      </span>

      {exercise?.weight ? (
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[48px]">
          <button
            onClick={() =>
              WorkoutService.updateLog({
                ...set,
                weight: Math.max(0, (set.weight || 0) - 2.5),
              })
            }
            className="px-3 h-full text-slate-500 active:bg-slate-800"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={set.weight || ""}
            onChange={(e) =>
              WorkoutService.updateLog({
                ...set,
                weight: parseFloat(e.target.value),
              })
            }
            className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none"
          />
          <button
            onClick={() =>
              WorkoutService.updateLog({
                ...set,
                weight: (set.weight || 0) + 5,
              })
            }
            className="px-3 h-full text-slate-500 active:bg-slate-800"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : exercise?.distance ? (
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[48px]">
          <button
            onClick={() =>
              WorkoutService.updateLog({
                ...set,
                distance: Math.max(0, (set.distance || 0) - 0.1),
              })
            }
            className="px-3 h-full text-slate-500"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={set.distance || ""}
            onChange={(e) =>
              WorkoutService.updateLog({
                ...set,
                distance: parseFloat(e.target.value),
              })
            }
            className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none"
          />
          <button
            onClick={() =>
              WorkoutService.updateLog({
                ...set,
                distance: (set.distance || 0) + 0.5,
              })
            }
            className="px-3 h-full text-slate-500"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <div />
      )}

      {exercise?.reps ? (
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[48px]">
          <button
            onClick={() =>
              WorkoutService.updateLog({
                ...set,
                reps: Math.max(0, (set.reps || 0) - 1),
              })
            }
            className="px-3 h-full text-slate-500 active:bg-slate-800"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={set.reps || ""}
            onChange={(e) =>
              WorkoutService.updateLog({
                ...set,
                reps: parseFloat(e.target.value),
              })
            }
            className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none"
          />
          <button
            onClick={() =>
              WorkoutService.updateLog({ ...set, reps: (set.reps || 0) + 2 })
            }
            className="px-3 h-full text-slate-500 active:bg-slate-800"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : exercise?.duration ? (
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[48px] px-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder="MM"
            value={mins || ""}
            onChange={(e) =>
              WorkoutService.updateLog({
                ...set,
                duration: (parseInt(e.target.value) || 0) * 60 + secs,
              })
            }
            className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none py-2"
          />
          <span className="text-slate-600 font-black">:</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="SS"
            max="59"
            value={secs || ""}
            onChange={(e) =>
              WorkoutService.updateLog({
                ...set,
                duration: mins * 60 + (parseInt(e.target.value) || 0),
              })
            }
            className="w-full bg-transparent text-center text-[13px] font-black text-white outline-none py-2"
          />
        </div>
      ) : (
        <div />
      )}

      <button
        onClick={handleComplete}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all active:scale-90 ${set.completed === 1 ? "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-slate-800 text-slate-700"}`}
      >
        <Check size={20} strokeWidth={4} />
      </button>
    </div>
  );
};
