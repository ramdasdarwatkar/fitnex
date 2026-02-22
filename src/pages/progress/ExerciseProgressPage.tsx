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
  History,
  ChevronRight,
  Loader2,
  ChevronDown,
  Dumbbell,
  Target,
  Trophy,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { WorkoutService } from "../../services/WorkoutService";
import { PersonalRecordService } from "../../services/PersonalRecordService";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../db/database";
import { ExerciseCard } from "../workout/components/ExerciseCard";

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl outline-none ring-0">
        <p className="text-[10px] font-black uppercase italic text-slate-500 mb-2 tracking-widest">
          {payload[0].payload.fullDate}
        </p>
        <div className="space-y-3">
          {payload.map((entry: any, idx: number) => {
            const { val, unit } = getUnitData(entry.value, entry.name);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[9px] font-black uppercase italic text-slate-300">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-black text-white italic">
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

export const ExerciseProgressPage = () => {
  const { id: exerciseId } = useParams();
  const { user_id } = useAuth();

  const [exerciseName, setExerciseName] = useState("");
  const [rawPrs, setRawPrs] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
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
    if (showHistory) return setShowHistory(false);
    setHistoryLoading(true);
    try {
      const history = await WorkoutService.getExerciseHistory(
        user_id!,
        exerciseId!,
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

    const data = allDates.map((dateStr) => {
      const point: any = {
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
      <div className="flex-1 flex items-center justify-center h-screen bg-[#020617]">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" />
      </div>
    );

  return (
    <SubPageLayout title="Performance Lab">
      {/* RESTORED GLOW FILTERS AND NUCLEAR BORDER FIX */}
      <style>{`
        .recharts-surface, .recharts-wrapper { outline: none !important; border: none !important; -webkit-tap-highlight-color: transparent !important; }
        .recharts-layer:focus { outline: none !important; }
        .line-glow-primary { filter: drop-shadow(0px 0px 6px var(--brand-primary)); }
        .line-glow-secondary { filter: drop-shadow(0px 0px 6px #3b82f6); }
      `}</style>

      <div className="flex flex-col gap-6 pb-32 px-1">
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 mb-10 border-b border-white/5 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                  <Trophy size={20} />
                </div>
                <h2 className="text-lg font-black uppercase italic text-white leading-tight max-w-[150px] truncate">
                  {exerciseName}
                </h2>
              </div>
              <div className="flex gap-4">
                {bestStats.map((s, i) => (
                  <div key={i} className="text-right">
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">
                      {s.type}
                    </p>
                    <p
                      className={`text-xl font-black italic leading-none mt-1 ${i === 0 ? "text-[var(--brand-primary)]" : "text-blue-400"}`}
                    >
                      {s.val}
                      <span className="text-[8px] ml-0.5 uppercase italic">
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
              <AreaChart data={chartData} accessibilityLayer={false}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis dataKey="date" hide />

                <YAxis yAxisId="left" hide domain={["auto", "auto"]} />
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

                {/* PRIMARY LINE WITH GLOW - NO DARK AREA FILL */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  name={activeTypes[0]}
                  dataKey={activeTypes[0]}
                  stroke="var(--brand-primary)"
                  strokeWidth={4}
                  fill="transparent"
                  className="line-glow-primary"
                  connectNulls
                  dot={{ r: 4, fill: "var(--brand-primary)", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: "#0f172a",
                    strokeWidth: 3,
                    fill: "var(--brand-primary)",
                  }}
                />

                {/* SECONDARY LINE WITH GLOW - NO DARK AREA FILL */}
                {activeTypes[1] && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    name={activeTypes[1]}
                    dataKey={activeTypes[1]}
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fill="transparent"
                    className="line-glow-secondary"
                    connectNulls
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      stroke: "#0f172a",
                      strokeWidth: 3,
                      fill: "#3b82f6",
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <button
          onClick={handleShowHistory}
          className="w-full bg-slate-900 border border-white/10 rounded-[2rem] py-6 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          {historyLoading ? (
            <Loader2 className="animate-spin text-slate-500" size={18} />
          ) : (
            <>
              <History
                size={18}
                className={
                  showHistory ? "text-[var(--brand-primary)]" : "text-slate-500"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {showHistory ? "Hide Records" : "View History"}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${showHistory ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {showHistory && (
          <div className="space-y-4 px-1 pb-10">
            {sessionHistory.length > 0 ? (
              sessionHistory.map((w) => {
                const isExpanded = expandedWorkoutId === w.id;
                const peakVal = Math.max(
                  ...(w.logs?.map(
                    (l: any) => l.weight || l.distance || l.duration,
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
                      className={`bg-slate-900/40 border rounded-[1.8rem] p-5 flex items-center justify-between transition-all duration-300 ${isExpanded ? "border-[var(--brand-primary)]/40 bg-slate-900/80" : "border-white/5"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-slate-800 p-2 rounded-xl min-w-[45px]">
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
                            {w.logs?.length || 0} Sets • Peak: {summary.val}
                            {summary.unit}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-slate-700 transition-transform ${isExpanded ? "rotate-90 text-[var(--brand-primary)]" : ""}`}
                      />
                    </div>
                    <div
                      className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <div className="pt-4 px-2">
                          <ExerciseCard
                            name=""
                            rows={w.logs}
                            fv={(v: any) => v || "-"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-10">
                <Dumbbell size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  No history
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};
