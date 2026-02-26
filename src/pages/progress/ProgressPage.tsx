import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { BodyMetricsService } from "../../services/BodyMetricsService";
import type { BodyMetrics } from "../../types/database.types";
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
  ChevronDown,
  Loader2,
  Scale,
  Activity,
  Ruler,
} from "lucide-react";

// 1. Strict Configuration Types
interface MetricConfig {
  label: string;
  columns: string[];
  unit: string;
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
  weight: { label: "Body Weight", columns: ["weight"], unit: "kg" },
  height: { label: "Height", columns: ["height"], unit: "cm" },
  belly: { label: "Belly", columns: ["belly"], unit: "in" },
  waist: { label: "Waist", columns: ["waist"], unit: "in" },
  hips: { label: "Hips", columns: ["hips"], unit: "in" },
  chest: { label: "Chest", columns: ["chest"], unit: "in" },
  shoulder: { label: "Shoulder", columns: ["shoulder"], unit: "in" },
  neck: { label: "Neck", columns: ["neck"], unit: "in" },
  biceps: {
    label: "Biceps (R/L)",
    columns: ["right_bicep", "left_bicep"],
    unit: "in",
  },
  forearms: {
    label: "Forearms (R/L)",
    columns: ["right_forearm", "left_forearm"],
    unit: "in",
  },
  calves: {
    label: "Calves (R/L)",
    columns: ["right_calf", "left_calf"],
    unit: "in",
  },
  thighs: {
    label: "Thighs (R/L)",
    columns: ["right_thigh", "left_thigh"],
    unit: "in",
  },
};

export const ProgressPage = () => {
  const { user_id } = useAuth();
  const [selectedKey, setSelectedKey] = useState<string>("weight");
  const [history, setHistory] = useState<BodyMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!user_id) return;
      setLoading(true);
      try {
        const config = METRIC_CONFIG[selectedKey];
        const data = await BodyMetricsService.getMetricHistory(
          user_id,
          config.columns,
        );
        if (isMounted) setHistory(data);
      } catch (err: unknown) {
        console.error("Failed to load progress history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedKey, user_id]);

  const currentMetric = METRIC_CONFIG[selectedKey];

  const chartData = useMemo(() => {
    return history.map((item) => ({
      ...item,
      date: format(new Date(item.logdate), "MMM dd"),
    }));
  }, [history]);

  return (
    <div className="flex flex-col min-h-screen bg-bg-main pb-32 animate-in fade-in duration-500">
      <header className="pt-12">
        <h1 className="text-2xl font-black uppercase italic text-text-main mb-6 tracking-tighter">
          Body <span className="text-brand-primary">Progress</span>
        </h1>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-bg-surface border border-border-color rounded-2xl py-5 px-6 flex items-center justify-between text-text-main active:scale-[0.98] transition-all shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Scale size={18} className="text-brand-primary" />
              <span className="font-black uppercase italic text-sm tracking-tight">
                {currentMetric.label}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`text-text-muted transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-bg-surface border border-border-color rounded-4xl overflow-hidden z-50 shadow-2xl animate-in zoom-in-95 duration-200 max-h-80 overflow-y-auto p-2 space-y-1">
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedKey(key);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-4 text-left text-[11px] font-black uppercase italic rounded-xl transition-colors ${
                    selectedKey === key
                      ? "bg-brand-primary text-black"
                      : "text-text-muted hover:bg-bg-main"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        <div className="p-6 px-0 space-y-8">
          {/* CHART AREA */}
          <div className="bg-bg-surface border border-border-color rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 border-b border-border-color/50 pb-6">
              <div>
                <p className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] italic">
                  Trend Analysis
                </p>
                <h2 className="text-xl font-black uppercase italic text-text-main leading-none mt-2">
                  {currentMetric.label}
                </h2>
              </div>
              {history.length > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] italic">
                    Current
                  </p>
                  <p className="text-2xl font-black italic text-brand-primary leading-none mt-1 tabular-nums">
                    {/* FIXED: No 'any' type via record casting */}
                    {
                      (
                        history[history.length - 1] as unknown as Record<
                          string,
                          number
                        >
                      )[currentMetric.columns[0]]
                    }
                    <span className="text-[10px] ml-1 uppercase text-text-muted">
                      {currentMetric.unit}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="h-64 -mx-4 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorMetric"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0.3}
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
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "20px",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      fontStyle: "italic",
                      color: "var(--brand-primary)",
                    }}
                  />
                  {currentMetric.columns.map((col, idx) => (
                    <Area
                      key={col}
                      type="monotone"
                      dataKey={col}
                      stroke={idx === 0 ? "var(--brand-primary)" : "#38bdf8"}
                      strokeWidth={4}
                      fill={idx === 0 ? "url(#colorMetric)" : "transparent"}
                      animationDuration={1500}
                      dot={{
                        r: 4,
                        strokeWidth: 0,
                        fill: idx === 0 ? "var(--brand-primary)" : "#38bdf8",
                      }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* STATS SUMMARY */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Activity size={16} />}
              label="Logs Count"
              value={history.length}
            />
            <StatCard
              icon={<HistoryIcon size={16} />}
              label="Latest Date"
              value={
                history.length > 0
                  ? format(
                      new Date(history[history.length - 1].logdate),
                      "MMM dd",
                    )
                  : "N/A"
              }
            />
          </div>

          {/* HISTORY ROWS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-text-muted tracking-[0.3em] ml-4 mb-2 flex items-center gap-2 italic">
              <Ruler size={12} className="text-brand-primary" /> Log History
            </h3>
            {history
              .slice()
              .reverse()
              .map((row, i) => (
                <div
                  key={`${row.logdate}-${i}`}
                  className="bg-bg-surface border border-border-color rounded-[1.8rem] p-6 flex items-center justify-between shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex flex-col">
                    <p className="text-[11px] font-black text-text-main uppercase italic leading-none mb-1.5">
                      {format(new Date(row.logdate), "EEEE, MMM dd")}
                    </p>
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                      Confirmed Measurement
                    </p>
                  </div>
                  <div className="flex gap-5">
                    {currentMetric.columns.map((col, idx) => {
                      // FIXED: Resolving "Unexpected any" by casting to Record
                      const val = (
                        row as unknown as Record<string, number | null>
                      )[col];
                      return (
                        <div key={col} className="text-right">
                          <span className="text-[8px] font-black uppercase text-text-muted block leading-none mb-1.5 opacity-60">
                            {col.includes("left")
                              ? "Left"
                              : col.includes("right")
                                ? "Right"
                                : "Val"}
                          </span>
                          <p
                            className={`text-sm font-black italic tabular-nums ${idx === 0 ? "text-text-main" : "text-[#38bdf8]"}`}
                          >
                            {val ?? "—"}
                            <span className="text-[8px] ml-1 opacity-40">
                              {currentMetric.unit}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Sub-component
const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="bg-bg-surface border border-border-color p-6 rounded-4xl shadow-sm">
    <div className="text-text-muted mb-3 opacity-40">{icon}</div>
    <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mb-2 italic">
      {label}
    </p>
    <p className="text-2xl font-black italic text-text-main leading-none tabular-nums">
      {value}
    </p>
  </div>
);
