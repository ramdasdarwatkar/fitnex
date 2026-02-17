import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import {
  Timer,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  CircleMinus,
  Trash2,
  Calculator,
  Play,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useWorkout } from "../../context/WorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../db/database";
import { WorkoutService } from "../../services/WorkoutService";
import { ExercisePicker } from "../library/exercises/ExercisePicker";
import { PlateCalculator } from "./PlateCalculator";

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
  const [calcWeight, setCalcWeight] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [pastDate, setPastDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pastStart, setPastStart] = useState("12:00");
  const [pastEnd, setPastEnd] = useState("13:00");

  useEffect(() => {
    if (activeWorkout && mode === "live") {
      const start = new Date(activeWorkout.start_time).getTime();
      const interval = setInterval(
        () => setSeconds(Math.floor((Date.now() - start) / 1000)),
        1000,
      );
      return () => clearInterval(interval);
    }
  }, [activeWorkout, mode]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, any[]> = {};
    activeLogs.forEach((log: any) => {
      if (!groups[log.exercise_id]) groups[log.exercise_id] = [];
      groups[log.exercise_id].push(log);
    });
    return groups;
  }, [activeLogs]);

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
                className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={pastStart}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="bg-black border border-slate-800 p-4 rounded-2xl text-white font-black"
                />
                <input
                  type="time"
                  value={pastEnd}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="bg-black border border-slate-800 p-4 rounded-2xl text-white font-black"
                />
              </div>
            </div>
            {/* THIS BUTTON TRIGGER IS EXPLICIT - NO AUTO CALLS */}
            <button
              onClick={() => user_id && WorkoutService.startNewWorkout(user_id)}
              className="w-full py-5 bg-[var(--brand-primary)] text-black rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl"
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
            onClick={() => setShowFinishModal(true)}
            className="bg-[var(--brand-primary)] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic active:scale-95"
          >
            Finish
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-48">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.2rem]">
          {mode === "live" ? (
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-slate-500 uppercase italic">
                Duration
              </span>
              <div className="text-2xl font-black italic text-[var(--brand-primary)] tabular-nums flex items-center gap-2">
                <Timer size={18} className="animate-pulse" />{" "}
                {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, "0")}
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">
                Completed on
              </span>
              <span className="text-[11px] font-black uppercase text-white tracking-widest">
                {format(new Date(pastDate), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-10">
          {Object.entries(groupedExercises).map(([exId, sets]) => (
            <ExerciseTable
              key={exId}
              exerciseId={exId}
              sets={sets}
              onRemove={() =>
                WorkoutService.deleteExercise(activeWorkout.id, exId)
              }
              onRest={() => mode === "live" && setRestSeconds(60)}
              activeWorkoutId={activeWorkout.id}
              onCalc={setCalcWeight}
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
          }}
        />
      )}
      {calcWeight !== null && (
        <PlateCalculator
          weight={calcWeight}
          onClose={() => setCalcWeight(null)}
        />
      )}

      {showFinishModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 animate-in slide-in-from-bottom">
            <h2 className="text-xl font-black uppercase italic text-white mb-6">
              Workout Summary
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes..."
              className="w-full bg-black border border-slate-800 rounded-2xl p-5 text-xs text-white h-32 mb-8 outline-none focus:border-[var(--brand-primary)]"
            />
            <button
              onClick={() => {
                const times =
                  mode === "past"
                    ? {
                        start: new Date(
                          `${pastDate}T${pastStart}`,
                        ).toISOString(),
                        end: new Date(`${pastDate}T${pastEnd}`).toISOString(),
                      }
                    : undefined;
                WorkoutService.finishWorkout(
                  activeWorkout.id,
                  notes,
                  times,
                ).then(() => navigate("/dashboard"));
              }}
              className="w-full py-5 bg-[var(--brand-primary)] text-black rounded-3xl font-black uppercase italic shadow-xl"
            >
              Complete
            </button>
          </div>
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

      {restSeconds && (
        <div className="fixed bottom-28 left-4 right-4 bg-[var(--brand-primary)] rounded-2xl p-4 flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom z-50">
          <div className="flex items-center gap-4 text-black font-black italic">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-[var(--brand-primary)]">
              {restSeconds}s
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
    </SubPageLayout>
  );
};

const ExerciseTable = ({
  exerciseId,
  sets,
  onRemove,
  onRest,
  activeWorkoutId,
  onCalc,
}: any) => {
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
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
        <button onClick={() => setMenu(!menu)} className="text-slate-600 p-1">
          <MoreVertical size={16} />
        </button>
        {menu && (
          <div className="absolute right-0 top-10 bg-slate-900 border border-slate-800 rounded-xl p-2 z-10 shadow-2xl">
            <button
              onClick={onRemove}
              className="flex items-center gap-2 px-4 py-2 text-red-500 text-[10px] font-black uppercase italic whitespace-nowrap"
            >
              <Trash2 size={12} /> Remove Card
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-1">
          <div className="grid grid-cols-[30px_30px_1fr_60px_60px_45px] gap-2 px-1 mb-2 items-center text-center">
            <div />
            <span className="text-[7px] font-black text-slate-600 uppercase">
              Set
            </span>
            <span className="text-[7px] font-black text-slate-600 uppercase">
              Prev
            </span>
            {exercise?.weight && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                {exercise.bodyweight ? "+ KG" : "KG"}
              </span>
            )}
            {exercise?.reps && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                Reps
              </span>
            )}
            {exercise?.distance && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                KM
              </span>
            )}
            {exercise?.duration && (
              <span className="text-[7px] font-black text-slate-600 uppercase">
                Sec
              </span>
            )}
            <span className="text-[7px] font-black text-slate-600 uppercase text-right mr-1">
              Done
            </span>
          </div>

          {sets.map((set: any, i: number) => (
            <div
              key={set.id}
              className={`grid grid-cols-[30px_30px_1fr_60px_60px_45px] gap-2 items-center py-1 rounded-lg ${set.completed === 1 ? "bg-green-500/10" : ""}`}
            >
              <button
                onClick={() => WorkoutService.deleteSet(set.id)}
                className="text-red-500/30 flex justify-center active:scale-90"
              >
                <CircleMinus size={16} />
              </button>
              <span className="text-[10px] font-black text-slate-500 text-center">
                {i + 1}
              </span>
              <div className="text-[8px] font-bold text-slate-700 text-center italic">
                —
              </div>

              {exercise?.weight && (
                <div className="relative group">
                  <input
                    type="number"
                    step="0.5"
                    placeholder={exercise.bodyweight ? "Add" : "0"}
                    value={set.weight || ""}
                    onChange={(e) =>
                      WorkoutService.updateLog({
                        ...set,
                        weight: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-900 border-none rounded-md py-2 text-center text-xs font-black text-white w-full outline-none focus:bg-slate-800"
                  />
                  {!exercise.bodyweight && (set.weight || 0) >= 20 && (
                    <button
                      onClick={() => onCalc(set.weight)}
                      className="absolute -top-1 -right-1 bg-black p-0.5 rounded border border-slate-800 text-[var(--brand-primary)]"
                    >
                      <Calculator size={8} />
                    </button>
                  )}
                </div>
              )}
              {exercise?.reps && (
                <input
                  type="number"
                  value={set.reps || ""}
                  onChange={(e) =>
                    WorkoutService.updateLog({
                      ...set,
                      reps: parseInt(e.target.value),
                    })
                  }
                  className="bg-slate-900 border-none rounded-md py-2 text-center text-xs font-black text-white w-full outline-none focus:bg-slate-800"
                />
              )}
              {exercise?.distance && (
                <input
                  type="number"
                  step="0.1"
                  value={set.distance || ""}
                  onChange={(e) =>
                    WorkoutService.updateLog({
                      ...set,
                      distance: parseFloat(e.target.value),
                    })
                  }
                  className="bg-slate-900 border-none rounded-md py-2 text-center text-xs font-black text-white w-full outline-none focus:bg-slate-800"
                />
              )}
              {exercise?.duration && (
                <input
                  type="number"
                  value={set.duration || ""}
                  onChange={(e) =>
                    WorkoutService.updateLog({
                      ...set,
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="bg-slate-900 border-none rounded-md py-2 text-center text-xs font-black text-white w-full outline-none focus:bg-slate-800"
                />
              )}

              <button
                onClick={() => {
                  const nextVal = set.completed === 1 ? 0 : 1;
                  WorkoutService.updateLog({ ...set, completed: nextVal });
                  if (nextVal === 1) onRest();
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all active:scale-90 ${set.completed === 1 ? "bg-green-500 text-black" : "bg-slate-800 text-slate-700"}`}
              >
                <Check size={14} strokeWidth={4} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              WorkoutService.addSet(
                activeWorkoutId,
                exerciseId,
                sets.length + 1,
              )
            }
            className="w-full py-2 bg-slate-900/40 rounded-lg text-[9px] font-black uppercase text-slate-500 mt-2 hover:bg-slate-800 hover:text-white transition-all"
          >
            + Add Set
          </button>
        </div>
      )}
    </div>
  );
};
