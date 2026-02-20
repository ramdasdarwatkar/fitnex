import { useState, useMemo, useEffect } from "react";
import { WorkoutService } from "../../services/WorkoutService";
import { useAuth } from "../../context/AuthContext";
import { ExercisePicker } from "../library/exercises/ExercisePicker";
import { ExerciseCard } from "../workout/components/ExerciseCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import {
  History,
  ChevronRight,
  Loader2,
  ChevronDown,
  Search,
  Dumbbell,
  Target,
} from "lucide-react";
import { PersonalRecordService } from "../../services/PersonalRecordService";
import { db } from "../../db/database";

type WorkoutLog = {
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  distance: number;
  duration: number;
};

type WorkoutHistoryRow = {
  id: string;
  start_time: string;
  workout_name: string;
  logs: WorkoutLog[];
};

type PrHistory = {
  value: number;
  record_date: string;
};

export const ProgressPage = () => {
  const { user_id } = useAuth();
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [prHistory, setPrHistory] = useState<PrHistory[]>([]);
  const [sessionHistory, setSessionHistory] = useState<WorkoutHistoryRow[]>([]);

  // UI States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(
    null,
  );

  const fv = (v: any, u?: string) => {
    if (v === null || v === undefined || v === 0) return "-";
    return u ? `${v}${u}` : `${v}`;
  };

  useEffect(() => {
    if (exerciseId) {
      db.exercises
        .get(exerciseId)
        .then((ex) => setExerciseName(ex?.name || ""));
    }
  }, [exerciseId]);

  useEffect(() => {
    const loadPRs = async () => {
      if (!user_id || !exerciseId) return;
      setLoading(true);
      setShowHistory(false);
      setExpandedWorkoutId(null);
      try {
        const prs = await PersonalRecordService.getExercisePRs(
          user_id,
          exerciseId,
        );
        setPrHistory(prs || []);
      } catch (err) {
        console.error("PR Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPRs();
  }, [exerciseId, user_id]);

  const handleShowHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    if (!user_id || !exerciseId) return;

    setHistoryLoading(true);
    try {
      const history = await WorkoutService.getExerciseHistory(
        user_id,
        exerciseId,
      );
      setSessionHistory((history as unknown as WorkoutHistoryRow[]) || []);
      setShowHistory(true);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return [...prHistory]
      .sort(
        (a, b) =>
          new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
      )
      .map((p) => ({
        date: format(new Date(p.record_date), "MMM dd"),
        weight: p.value,
      }));
  }, [prHistory]);

  const allTimeBest = useMemo(
    () => (prHistory.length ? Math.max(...prHistory.map((pr) => pr.value)) : 0),
    [prHistory],
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] pb-32">
      <header className="p-6 pt-12">
        <h1 className="text-2xl font-black uppercase italic text-white mb-6 tracking-tighter">
          Progress <span className="text-[var(--brand-primary)]">Lab</span>
        </h1>

        <button
          onClick={() => setIsPickerOpen(true)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-4 px-5 flex items-center justify-between text-white active:scale-95 transition-all shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <Search size={18} className="text-slate-500" />
            <span
              className={`font-bold uppercase italic text-sm ${!exerciseId ? "text-slate-500" : "text-white"}`}
            >
              {exerciseName || "Search Exercise..."}
            </span>
          </div>
          <ChevronDown size={18} className="text-slate-600" />
        </button>
      </header>

      {isPickerOpen && (
        <ExercisePicker
          onClose={() => setIsPickerOpen(false)}
          onAdd={(ids) => {
            if (ids.length > 0) setExerciseId(ids[0]);
            setIsPickerOpen(false);
          }}
        />
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : exerciseId ? (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-8 px-2 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                  <Dumbbell size={20} />
                </div>
                <h2 className="text-lg font-black uppercase italic text-white leading-tight max-w-[180px] truncate">
                  {exerciseName}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Max PR
                </p>
                <p className="text-2xl font-black italic text-[var(--brand-primary)]">
                  {allTimeBest}
                  <span className="text-xs ml-0.5">kg</span>
                </p>
              </div>
            </div>

            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorWeight"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    itemStyle={{
                      color: "var(--brand-primary)",
                      fontWeight: "bold",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--brand-primary)"
                    strokeWidth={4}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={handleShowHistory}
            disabled={historyLoading}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {historyLoading ? (
              <Loader2 className="animate-spin text-slate-500" size={18} />
            ) : (
              <>
                <History
                  size={18}
                  className={
                    showHistory
                      ? "text-[var(--brand-primary)]"
                      : "text-slate-500"
                  }
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {showHistory ? "Hide Records" : "View Session History"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform duration-500 ${showHistory ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {/* SESSION LIST WITH SLOW ANIMATION */}
          {showHistory && (
            <div className="space-y-3 animate-in fade-in duration-700">
              {sessionHistory.length > 0 ? (
                sessionHistory.map((w) => {
                  const isExpanded = expandedWorkoutId === w.id;
                  const sessionMax = Math.max(
                    ...(w.logs?.map((l) => l.weight) || [0]),
                  );

                  return (
                    <div key={w.id} className="flex flex-col overflow-hidden">
                      <div
                        onClick={() =>
                          setExpandedWorkoutId(isExpanded ? null : w.id)
                        }
                        className={`bg-slate-900/40 border rounded-2xl p-4 flex items-center justify-between transition-all duration-500 cursor-pointer z-10 ${
                          isExpanded
                            ? "border-[var(--brand-primary)]/40 bg-slate-900/80"
                            : "border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center bg-slate-800 p-2 rounded-xl min-w-[45px] border border-white/5">
                            <p className="text-xs font-black text-white">
                              {format(new Date(w.start_time), "dd")}
                            </p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">
                              {format(new Date(w.start_time), "MMM")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase italic truncate max-w-[150px]">
                              {w.workout_name}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                              {w.logs?.length || 0} Sets • {sessionMax}kg Peak
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={14}
                          className={`text-slate-700 transition-transform duration-500 ${isExpanded ? "rotate-90 text-[var(--brand-primary)]" : ""}`}
                        />
                      </div>

                      {/* SLOW ANIMATED CONTAINER */}
                      <div
                        className={`grid transition-[grid-template-rows] duration-700 ease-in-out ${
                          isExpanded
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-1 pt-3">
                            <ExerciseCard
                              name="" // Removed "Set Details" label
                              rows={w.logs}
                              fv={fv}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-[10px] font-bold text-slate-600 uppercase py-8 opacity-40 italic">
                  No session history found.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-30 text-center">
    <Target size={48} className="text-slate-500 mb-4" />
    <p className="font-black uppercase italic text-white text-sm tracking-widest leading-relaxed">
      Select an Exercise
      <br />
      to track your Gains
    </p>
  </div>
);
