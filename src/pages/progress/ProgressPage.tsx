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
} from "lucide-react";

// --- CONFIG ---

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

// --- MAIN COMPONENT ---

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
        const data = await BodyMetricsService.getMetricHistory(
          user_id,
          METRIC_CONFIG[selectedKey].columns,
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

  const chartData = useMemo(
    () =>
      history.map((item) => ({
        ...item,
        date: format(new Date(item.logdate), "MMM dd"),
      })),
    [history],
  );

  const latestValue =
    history.length > 0
      ? (history[history.length - 1] as unknown as Record<string, number>)[
          currentMetric.columns[0]
        ]
      : null;

  return (
    <div className="flex flex-col pb-40 animate-in fade-in duration-700">
      {/* ── HEADER & SELECTOR ── */}
      <header className="pt-6 space-y-4">
        <h1 className="text-[10px] font-black uppercase italic text-brand-primary tracking-[0.4em] text-center">
          Biometric <span className="text-text-main">Analysis</span>
        </h1>

        {/* Metric selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-bg-surface border border-border-color/40 rounded-2xl py-[18px] px-5
                       flex items-center justify-between text-text-main
                       active:scale-[0.98] transition-all group card-glow"
          >
            <div className="flex items-center gap-3">
              <Scale size={18} className="text-brand-primary" />
              <span className="font-black uppercase italic text-[13px] tracking-widest group-hover:text-brand-primary transition-colors">
                {currentMetric.label}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`text-text-muted/40 transition-transform duration-300 ${
                isDropdownOpen ? "rotate-180 text-brand-primary" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-bg-surface border border-border-color/60
                         rounded-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200
                         max-h-72 overflow-y-auto p-2 space-y-0.5"
              style={{
                boxShadow:
                  "0 8px 32px var(--shadow-sm), 0 2px 8px var(--shadow-xs)",
              }}
            >
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedKey(key);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-3.5 text-left text-[11px] font-black uppercase italic
                              rounded-xl transition-all active:scale-95 ${
                                selectedKey === key
                                  ? "bg-brand-primary"
                                  : "text-text-muted/60 hover:text-text-main hover:bg-bg-main"
                              }`}
                  style={
                    selectedKey === key
                      ? { color: "var(--color-on-brand)" }
                      : undefined
                  }
                >
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── LOADING STATE ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-40">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        <div className="pt-8 space-y-8">
          {/* ── CHART CARD ── */}
          <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 relative overflow-hidden card-glow">
            {/* Decorative glow blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />

            {/* Card header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-border-color/20">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-text-muted/40 tracking-[0.25em] italic">
                  Trend Algorithm
                </p>
                <h2 className="text-xl font-black uppercase italic text-text-main leading-none">
                  {currentMetric.label}
                </h2>
              </div>
              {latestValue != null && (
                <div className="text-right space-y-1">
                  <p className="text-[9px] font-black uppercase text-text-muted/40 tracking-[0.25em] italic">
                    Latest Sync
                  </p>
                  <p
                    className="text-2xl font-black italic text-brand-primary leading-none tabular-nums"
                    style={{ textShadow: "0 0 20px var(--glow-primary)" }}
                  >
                    {latestValue}
                    <span className="text-[10px] ml-1 uppercase text-text-muted/40 font-black tracking-normal">
                      {currentMetric.unit}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="h-56 -mx-2">
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
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <filter id="glow">
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
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px var(--shadow-sm)",
                    }}
                    itemStyle={{
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      fontStyle: "italic",
                      color: "var(--brand-primary)",
                    }}
                    labelStyle={{
                      fontSize: "9px",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  />
                  {currentMetric.columns.map((col, idx) => (
                    <Area
                      key={col}
                      type="monotone"
                      dataKey={col}
                      stroke={
                        idx === 0
                          ? "var(--brand-primary)"
                          : "var(--brand-secondary)"
                      }
                      strokeWidth={3}
                      fill={idx === 0 ? "url(#colorMetric)" : "transparent"}
                      animationDuration={1200}
                      filter="url(#glow)"
                      dot={{
                        r: 3,
                        strokeWidth: 0,
                        fill:
                          idx === 0
                            ? "var(--brand-primary)"
                            : "var(--brand-secondary)",
                      }}
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                        fill: "var(--color-on-brand)",
                      }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── SUMMARY TILES ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Activity size={16} />}
              label="Total Records"
              value={history.length}
            />
            <StatCard
              icon={<HistoryIcon size={16} />}
              label="Last Synced"
              value={
                history.length > 0
                  ? format(
                      new Date(history[history.length - 1].logdate),
                      "MMM dd",
                    )
                  : "—"
              }
            />
          </div>

          {/* ── MEASUREMENT ARCHIVE ── */}
          <div className="space-y-4">
            <SectionLabel label="Measurement Archive" />

            <div className="space-y-2">
              {[...history].reverse().map((row, i) => (
                <div
                  key={`${row.logdate}-${i}`}
                  className="bg-bg-surface border border-border-color/40 rounded-2xl px-5 py-4
                             flex items-center justify-between card-glow
                             active:scale-[0.98] transition-all duration-200
                             hover:border-brand-primary/20"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-black text-text-main uppercase italic leading-none tracking-tight">
                      {format(new Date(row.logdate), "EEEE, MMM dd")}
                    </p>
                    <p className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest italic">
                      Biometric Sync
                    </p>
                  </div>

                  <div className="flex gap-5">
                    {currentMetric.columns.map((col, idx) => {
                      const val = (
                        row as unknown as Record<string, number | null>
                      )[col];
                      return (
                        <div key={col} className="text-right space-y-0.5">
                          <span className="text-[8px] font-black uppercase text-text-muted/40 block leading-none tracking-widest italic">
                            {col.includes("left")
                              ? "Left"
                              : col.includes("right")
                                ? "Right"
                                : "Value"}
                          </span>
                          <p
                            className="text-[15px] font-black italic tabular-nums leading-none"
                            style={{
                              color:
                                idx === 0
                                  ? "var(--brand-primary)"
                                  : "var(--brand-secondary)",
                            }}
                          >
                            {val ?? "—"}
                            <span className="text-[9px] ml-0.5 font-black text-text-muted/30">
                              {currentMetric.unit}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center text-text-muted/20">
                  <Scale size={40} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">
                    No records yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) => (
  <div
    className="bg-bg-surface border border-border-color/40 p-5 rounded-2xl card-glow
                  active:scale-[0.97] transition-all group"
  >
    <div className="text-brand-primary/50 mb-4 transition-all group-hover:scale-110 group-hover:text-brand-primary">
      {icon}
    </div>
    <p className="text-[9px] font-black uppercase text-text-muted/40 tracking-widest leading-none mb-2 italic">
      {label}
    </p>
    <p className="text-2xl font-black italic text-text-main leading-none tabular-nums tracking-tighter">
      {value}
    </p>
  </div>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px var(--glow-primary)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>
    <span className="text-[9.5px] font-black uppercase tracking-[0.35em] text-text-muted/50 italic whitespace-nowrap">
      {label}
    </span>
    <div
      className="h-px flex-1"
      style={{
        background:
          "linear-gradient(to right, var(--border-color), transparent)",
        opacity: 0.4,
      }}
    />
  </div>
);
