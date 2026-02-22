import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { BodyMetricsService } from "../../services/BodyMetricsService";
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
  Ruler,
  Activity,
  RulerIcon,
} from "lucide-react";

// Config including Unit logic
const METRIC_CONFIG: Record<
  string,
  { label: string; columns: string[]; unit: string }
> = {
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
  const [selectedKey, setSelectedKey] = useState("weight");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user_id) return;
      setLoading(true);
      try {
        const config = METRIC_CONFIG[selectedKey];
        const data = await BodyMetricsService.getMetricHistory(
          user_id,
          config.columns,
        );
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedKey, user_id]);

  const currentMetric = METRIC_CONFIG[selectedKey];

  const chartData = useMemo(() => {
    return history.map((item) => ({
      ...item,
      date: format(new Date(item.logdate), "MMM dd"),
    }));
  }, [history]);

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] pb-32">
      <header className="p-6 pt-12">
        <h1 className="text-2xl font-black uppercase italic text-white mb-6 tracking-tighter">
          Body <span className="text-[var(--brand-primary)]">Progress</span>
        </h1>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-5 flex items-center justify-between text-white active:scale-[0.98] transition-all shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Scale size={18} className="text-[var(--brand-primary)]" />
              <span className="font-bold uppercase italic text-sm">
                {currentMetric.label}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`text-slate-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-64 overflow-y-auto">
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedKey(key);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full p-4 text-left text-xs font-bold uppercase italic text-slate-300 hover:bg-slate-800 border-b border-slate-800/50 last:border-0 transition-colors"
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
          <Loader2 className="animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* CHART AREA */}
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-4">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  Trend Analysis
                </p>
                <h2 className="text-xl font-black uppercase italic text-white leading-none mt-1">
                  {currentMetric.label}
                </h2>
              </div>
              {history.length > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                    Current
                  </p>
                  <p className="text-2xl font-black italic text-[var(--brand-primary)] leading-none mt-1">
                    {history[history.length - 1][currentMetric.columns[0]]}
                    <span className="text-[10px] ml-1 uppercase">
                      {currentMetric.unit}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="h-60 -mx-4 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <style>{`.recharts-surface { outline: none; }`}</style>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "16px",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
                    }}
                    itemStyle={{
                      fontSize: "12px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      fontStyle: "italic",
                    }}
                  />
                  {currentMetric.columns.map((col, idx) => (
                    <Area
                      key={col}
                      type="monotone"
                      dataKey={col}
                      name={col.replace("_", " ")}
                      stroke={idx === 0 ? "var(--brand-primary)" : "#38bdf8"}
                      strokeWidth={4}
                      fill="transparent"
                      dot={{
                        r: 4,
                        strokeWidth: 0,
                        fill: idx === 0 ? "var(--brand-primary)" : "#38bdf8",
                      }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* STATS SUMMARY */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem]">
              <Activity size={16} className="text-slate-500 mb-2" />
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">
                Logs Count
              </p>
              <p className="text-2xl font-black italic text-white leading-none">
                {history.length}
              </p>
            </div>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem]">
              <HistoryIcon size={16} className="text-slate-500 mb-2" />
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">
                Latest Date
              </p>
              <p className="text-sm font-black italic text-white leading-none">
                {history.length > 0
                  ? format(
                      new Date(history[history.length - 1].logdate),
                      "MMM dd, yyyy",
                    )
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* HISTORY ROWS */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-4 mb-2 flex items-center gap-2">
              <RulerIcon size={12} /> Log History
            </h3>
            {history
              .slice()
              .reverse()
              .map((row, i) => (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-white uppercase italic leading-none mb-1">
                      {format(new Date(row.logdate), "EEEE, MMM dd")}
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                      Recorded Entry
                    </p>
                  </div>
                  <div className="flex gap-4">
                    {currentMetric.columns.map((col, idx) => (
                      <div key={col} className="text-right">
                        <span className="text-[8px] font-black uppercase text-slate-500 block leading-none mb-1">
                          {col.includes("left")
                            ? "Left"
                            : col.includes("right")
                              ? "Right"
                              : "Value"}
                        </span>
                        <p
                          className={`text-sm font-black italic ${idx === 0 ? "text-white" : "text-[#38bdf8]"}`}
                        >
                          {row[col]}
                          <span className="text-[8px] ml-0.5">
                            {currentMetric.unit}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
