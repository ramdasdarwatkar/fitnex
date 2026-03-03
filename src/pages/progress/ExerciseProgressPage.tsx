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

// --- INTERFACES ---

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

// --- UTILS ---

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

// --- CUSTOM TOOLTIP ---

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-bg-surface border border-border-color/60 p-4 rounded-2xl backdrop-blur-xl"
      style={{
        boxShadow: "0 8px 32px var(--shadow-sm), 0 0 0 1px var(--border-color)",
      }}
    >
      <p className="text-[9px] font-black uppercase italic text-text-muted/60 mb-3 tracking-[0.2em]">
        {payload[0].payload.fullDate}
      </p>
      <div className="space-y-2.5">
        {payload.map((entry, idx) => {
          const { val, unit } = getUnitData(entry.value, entry.name);
          return (
            <div key={idx} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: entry.color,
                    boxShadow: `0 0 6px ${entry.color}`,
                  }}
                />
                <span className="text-[10px] font-black uppercase italic text-text-muted/70 tracking-tight">
                  {entry.name}
                </span>
              </div>
              <span className="text-[13px] font-black text-brand-primary italic tabular-nums">
                {val}
                <span className="text-[9px] ml-1 text-text-muted/50 uppercase">
                  {unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

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

  // Fixed toggle logic — early return on already-open hides without re-fetching
  const handleShowHistory = async () => {
    if (showHistory) return setShowHistory(false);
    if (!user_id || !exerciseId) return;
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
        fullDate: format(new Date(dateStr), "MMM dd, yyyy"),
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

  const bestStats = useMemo(
    () =>
      activeTypes.map((type) => {
        const max = Math.max(
          ...rawPrs.filter((p) => p.value_type === type).map((p) => p.value),
        );
        return { type, ...getUnitData(max, type) };
      }),
    [rawPrs, activeTypes],
  );

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-bg-main">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );

  return (
    <SubPageLayout title="Telemetry Lab">
      <div className="flex flex-col gap-6 pb-40 animate-in fade-in duration-700">
        {/* ── CHART CARD ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 relative overflow-hidden card-glow">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col gap-5 mb-8 pb-6 border-b border-border-color/20">
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center
                           text-brand-primary border border-brand-primary/20"
                style={{ boxShadow: "0 0 16px var(--glow-primary)" }}
              >
                <Trophy size={22} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-black uppercase italic text-text-main leading-none tracking-tight">
                  {exerciseName}
                </h2>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/40 italic">
                  Biometric Scaling
                </p>
              </div>
            </div>

            {/* Peak stats */}
            <div className="flex gap-6">
              {bestStats.map((s, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-text-muted/40 tracking-widest italic">
                    Peak {s.type}
                  </p>
                  <p
                    className="text-2xl font-black italic leading-none tabular-nums"
                    style={{
                      color:
                        i === 0
                          ? "var(--brand-primary)"
                          : "var(--brand-secondary)",
                      textShadow:
                        i === 0
                          ? "0 0 20px var(--glow-primary)"
                          : "0 0 20px var(--glow-secondary)",
                    }}
                  >
                    {s.val}
                    <span className="text-[10px] ml-1 uppercase font-black text-text-muted/40">
                      {s.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--brand-primary)"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--brand-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  {/* Glow filters using fixed rgba — no missing tokens */}
                  <filter id="glowPrimary">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                  <filter id="glowSecondary">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="rgba(255,255,255,0.03)"
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
                  hide
                  domain={["auto", "auto"]}
                  orientation="right"
                />
                <Tooltip
                  cursor={{ stroke: "var(--glow-primary)", strokeWidth: 1 }}
                  content={<CustomTooltip />}
                />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey={activeTypes[0]}
                  stroke="var(--brand-primary)"
                  strokeWidth={3}
                  fill="url(#colorMain)"
                  filter="url(#glowPrimary)"
                  connectNulls
                  dot={{ r: 3, fill: "var(--brand-primary)", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: "var(--bg-surface)",
                    strokeWidth: 2,
                    fill: "var(--brand-primary)",
                  }}
                />

                {activeTypes[1] && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey={activeTypes[1]}
                    stroke="var(--brand-secondary)"
                    strokeWidth={3}
                    fill="transparent"
                    filter="url(#glowSecondary)"
                    connectNulls
                    dot={{
                      r: 3,
                      fill: "var(--brand-secondary)",
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: "var(--bg-surface)",
                      strokeWidth: 2,
                      fill: "var(--brand-secondary)",
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── HISTORY TOGGLE BUTTON ── */}
        <button
          onClick={handleShowHistory}
          className="w-full bg-bg-surface border border-border-color/40 rounded-2xl py-5
                     flex items-center justify-center gap-3
                     active:scale-[0.98] transition-all card-glow group"
        >
          {historyLoading ? (
            <Loader2 className="animate-spin text-brand-primary" size={20} />
          ) : (
            <>
              <HistoryIcon
                size={18}
                className={
                  showHistory
                    ? "text-brand-primary"
                    : "text-text-muted/40 group-hover:text-brand-primary transition-colors"
                }
              />
              <span className="text-[11px] font-black uppercase italic tracking-[0.3em] text-text-main">
                {showHistory ? "Hide Archive" : "Access Log Archive"}
              </span>
              <ChevronDown
                size={16}
                className={`text-text-muted/30 transition-transform duration-300 ${
                  showHistory ? "rotate-180 text-brand-primary" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* ── SESSION HISTORY ── */}
        {showHistory && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-500">
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
                  <div key={w.id}>
                    <button
                      onClick={() =>
                        setExpandedWorkoutId(isExpanded ? null : w.id)
                      }
                      className={`w-full bg-bg-surface border p-5 flex items-center justify-between
                                  transition-all duration-300 rounded-2xl card-glow ${
                                    isExpanded
                                      ? "border-brand-primary/40"
                                      : "border-border-color/40 hover:border-border-color/80"
                                  }`}
                      style={
                        isExpanded
                          ? { boxShadow: "0 0 20px var(--glow-primary)" }
                          : undefined
                      }
                    >
                      {/* Date badge + info */}
                      <div className="flex items-center gap-4">
                        <div
                          className="text-center bg-bg-main p-3 rounded-xl min-w-[52px]
                                     border border-border-color/30"
                        >
                          <p className="text-[15px] font-black italic text-text-main tabular-nums leading-none">
                            {format(new Date(w.start_time), "dd")}
                          </p>
                          <p className="text-[9px] font-black text-brand-primary uppercase italic mt-0.5 tracking-widest">
                            {format(new Date(w.start_time), "MMM")}
                          </p>
                        </div>
                        <div className="text-left space-y-1">
                          <p className="text-[13px] font-black text-text-main uppercase italic tracking-tight truncate max-w-44">
                            {w.workout_name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-text-muted/40 uppercase italic tracking-widest">
                              {w.logs?.length || 0} sets
                            </span>
                            <span className="text-text-muted/20">·</span>
                            <span className="text-[9px] font-black text-brand-primary uppercase italic tracking-widest">
                              Peak {summary.val}
                              {summary.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`text-text-muted/20 transition-transform duration-300 shrink-0 ${
                          isExpanded ? "rotate-90 text-brand-primary" : ""
                        }`}
                      />
                    </button>

                    {/* Expandable sets detail */}
                    <div
                      className={`grid transition-all duration-400 ease-in-out ${
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100 mt-2"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ExerciseCard
                          name=""
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
                );
              })
            ) : (
              <div
                className="py-20 flex flex-col items-center justify-center
                              border border-dashed border-border-color/30 rounded-2xl"
              >
                <Dumbbell
                  size={40}
                  strokeWidth={1}
                  className="text-text-muted/20 mb-4"
                />
                <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-text-muted/20">
                  Archive Empty
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};
