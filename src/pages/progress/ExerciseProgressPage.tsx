import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
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
  History as HistoryIcon,
  ChevronRight,
  Loader2,
  ChevronDown,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { WorkoutService } from "../../services/WorkoutService";
import { PersonalRecordService } from "../../services/PersonalRecordService";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../db/database";
import { ExerciseCard } from "../workout/components/ExerciseCard";

// --- 1. STRICT DOMAIN INTERFACES ---

interface PRRecord {
  record_date: string;
  value: number;
  value_type: string;
}

interface WorkoutLog {
  id: string;
  weight?: number | null;
  reps?: number | null;
  distance?: number | null;
  duration?: number | null;
  set_number?: number;
  [key: string]: string | number | null | undefined;
}

interface WorkoutHistorySession {
  id: string;
  workout_name: string;
  start_time: string;
  logs: WorkoutLog[];
}

interface ChartPoint {
  date: string;
  fullDate: string;
  [key: string]: number | string;
}

interface TooltipEntry {
  value: number;
  name: string;
  color: string;
  payload: ChartPoint;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

// --- 2. UTILITY LOGIC ---

const getUnitData = (value: number, type: string) => {
  const t = type?.toLowerCase();
  if (!value || value === 0) return { val: "0", unit: "" };
  if (t === "distance") return { val: (value / 1000).toFixed(2), unit: "km" };
  if (t === "duration") {
    const hrs = Math.floor(value / 3600);
    const mins = Math.floor((value % 3600) / 60);
    return hrs > 0
      ? { val: `${hrs}h ${mins}m`, unit: "" }
      : { val: `${mins}m`, unit: "" };
  }
  if (t === "reps") return { val: value.toString(), unit: "reps" };
  return { val: value.toString(), unit: "kg" };
};

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-surface border border-border-color p-4 rounded-2xl shadow-2xl backdrop-blur-xl ring-0">
        <p className="text-[10px] font-black uppercase italic text-text-muted mb-3 tracking-widest">
          {payload[0].payload.fullDate}
        </p>
        <div className="space-y-3">
          {payload.map((entry, idx) => {
            const { val, unit } = getUnitData(entry.value, entry.name);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-8"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[9px] font-black uppercase italic text-text-main">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-black text-brand-primary italic">
                  {val}
                  {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// --- 3. MAIN COMPONENT ---

export const ExerciseProgressPage = () => {
  const { id: exerciseId } = useParams<{ id: string }>();
  const { user_id } = useAuth();

  const [exerciseName, setExerciseName] = useState("");
  const [rawPrs, setRawPrs] = useState<PRRecord[]>([]);
  const [sessionHistory, setSessionHistory] = useState<WorkoutHistorySession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const init = async () => {
      if (!user_id || !exerciseId) return;
      try {
        const [ex, prs] = await Promise.all([
          db.exercises.get(exerciseId),
          PersonalRecordService.getExercisePRs(user_id, exerciseId),
        ]);
        setExerciseName(ex?.name || "Exercise");
        setRawPrs(prs || []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [exerciseId, user_id]);

  const handleShowHistory = async () => {
    if (showHistory || !user_id || !exerciseId) return setShowHistory(false);
    setHistoryLoading(true);
    try {
      const history = await WorkoutService.getExerciseHistory(
        user_id,
        exerciseId,
      );
      setSessionHistory(history || []);
      setShowHistory(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const { chartData, activeTypes } = useMemo(() => {
    if (!rawPrs.length) return { chartData: [], activeTypes: [] };
    const types = Array.from(new Set(rawPrs.map((p) => p.value_type)));
    const allDates = Array.from(
      new Set(rawPrs.map((p) => format(new Date(p.record_date), "yyyy-MM-dd"))),
    ).sort();

    const data: ChartPoint[] = allDates.map((dateStr) => {
      const point: ChartPoint = {
        fullDate: format(new Date(dateStr), "MMM dd, yy"),
        date: format(new Date(dateStr), "MMM dd"),
      };
      types.forEach((type) => {
        const match = rawPrs.find(
          (p) =>
            p.value_type === type &&
            format(new Date(p.record_date), "yyyy-MM-dd") === dateStr,
        );
        if (match) point[type] = match.value;
      });
      return point;
    });
    return { chartData: data, activeTypes: types };
  }, [rawPrs]);

  const bestStats = useMemo(() => {
    return activeTypes.map((type) => {
      const max = Math.max(
        ...rawPrs.filter((p) => p.value_type === type).map((p) => p.value),
      );
      return { type, ...getUnitData(max, type) };
    });
  }, [rawPrs, activeTypes]);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-bg-main">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );

  return (
    <SubPageLayout title="Performance Lab">
      <style>{`
        .recharts-surface, .recharts-wrapper { outline: none !important; }
        .line-glow-primary { filter: drop-shadow(0px 0px 6px var(--brand-primary)); }
        .line-glow-secondary { filter: drop-shadow(0px 0px 6px #3b82f6); }
      `}</style>

      <div className="flex flex-col gap-6 pb-32 px-1 animate-in fade-in duration-500">
        {/* CHART CARD */}
        <div className="bg-bg-surface border border-border-color rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-4 mb-10 border-b border-border-color/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Trophy size={20} />
                </div>
                <h2 className="text-lg font-black uppercase italic text-text-main leading-tight max-w-37.5 truncate">
                  {exerciseName}
                </h2>
              </div>
              <div className="flex gap-4">
                {bestStats.map((s, i) => (
                  <div key={i} className="text-right">
                    <p className="text-[8px] font-black uppercase text-text-muted tracking-widest italic leading-none">
                      {s.type}
                    </p>
                    <p
                      className={`text-xl font-black italic leading-none mt-1.5 ${i === 0 ? "text-brand-primary" : "text-blue-400"}`}
                    >
                      {s.val}
                      <span className="text-[8px] ml-0.5 uppercase">
                        {s.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis dataKey="date" hide />
                <YAxis
                  yAxisId="left"
                  hide
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }}
                  content={<CustomTooltip />}
                />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey={activeTypes[0]}
                  stroke="var(--brand-primary)"
                  strokeWidth={4}
                  fill="transparent"
                  className="line-glow-primary"
                  connectNulls
                  dot={{ r: 4, fill: "var(--brand-primary)", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: "var(--bg-surface)",
                    strokeWidth: 3,
                    fill: "var(--brand-primary)",
                  }}
                />

                {activeTypes[1] && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey={activeTypes[1]}
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fill="transparent"
                    className="line-glow-secondary"
                    connectNulls
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      stroke: "var(--bg-surface)",
                      strokeWidth: 3,
                      fill: "#3b82f6",
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HISTORY TRIGGER */}
        <button
          onClick={handleShowHistory}
          className="w-full bg-bg-surface border border-border-color rounded-4xl py-6 flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg"
        >
          {historyLoading ? (
            <Loader2 className="animate-spin text-text-muted" size={18} />
          ) : (
            <>
              <HistoryIcon
                size={18}
                className={
                  showHistory ? "text-brand-primary" : "text-text-muted"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-main">
                {showHistory ? "Hide Records" : "View History"}
              </span>
              <ChevronDown
                size={16}
                className={`text-text-muted transition-transform duration-300 ${showHistory ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {/* HISTORY LIST */}
        {showHistory && (
          <div className="space-y-4 px-1 pb-10 animate-in slide-in-from-top-2 duration-300">
            {sessionHistory.length > 0 ? (
              sessionHistory.map((w) => {
                const isExpanded = expandedWorkoutId === w.id;
                const peakVal = Math.max(
                  ...(w.logs?.map(
                    (l) => l.weight || l.distance || l.duration || 0,
                  ) || [0]),
                );
                const summary = getUnitData(
                  peakVal,
                  activeTypes[0] || "weight",
                );

                return (
                  <div key={w.id} className="flex flex-col">
                    <div
                      onClick={() =>
                        setExpandedWorkoutId(isExpanded ? null : w.id)
                      }
                      className={`bg-bg-surface/50 border rounded-[1.8rem] p-5 flex items-center justify-between transition-all duration-300 ${isExpanded ? "border-brand-primary/40 bg-bg-surface shadow-xl" : "border-border-color"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-bg-main p-2 rounded-xl min-w-11.25 border border-border-color">
                          <p className="text-xs font-black text-text-main tabular-nums">
                            {format(new Date(w.start_time), "dd")}
                          </p>
                          <p className="text-[8px] font-bold text-text-muted uppercase">
                            {format(new Date(w.start_time), "MMM")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-text-main uppercase italic truncate max-w-37.5">
                            {w.workout_name}
                          </p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight">
                            {w.logs?.length || 0} Sets • Peak: {summary.val}
                            {summary.unit}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-text-muted transition-transform ${isExpanded ? "rotate-90 text-brand-primary" : ""}`}
                      />
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <div className="pt-4 px-2">
                          <ExerciseCard
                            name=""
                            // DATA NORMALIZATION: Map optional/null fields to 0 for strict LogRow compatibility
                            rows={w.logs.map((log) => ({
                              ...log,
                              weight: log.weight ?? 0,
                              reps: log.reps ?? 0,
                              distance: log.distance ?? 0,
                              duration: log.duration ?? 0,
                              set_number: log.set_number ?? 1,
                            }))}
                            fv={(v: string | number | undefined) =>
                              v?.toString() || "-"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-20">
                <Dumbbell size={40} className="mb-4 text-text-muted" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-main">
                  No history found
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};
