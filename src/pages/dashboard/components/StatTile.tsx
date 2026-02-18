import { type ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  todayValue: number;
  weekValue: number;
  unit?: string;
  isTime?: boolean;
}

export const StatTile = ({
  icon,
  label,
  todayValue,
  weekValue,
  unit,
  isTime,
}: StatTileProps) => {
  // Formatter for Numbers and Time
  const formatValue = (val: number) => {
    if (isTime) {
      const h = Math.floor(val / 60);
      const m = Math.floor(val % 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return val?.toLocaleString() ?? "0";
  };

  const hasActivityToday = todayValue > 0;

  return (
    <div className="dashboard-card bg-slate-900/50 border border-slate-800 p-5 rounded-[2.2rem] flex flex-col justify-between min-h-[155px] group transition-all duration-300 hover:bg-slate-900">
      {/* TOP SECTION: Today's Progress */}
      <div className="flex justify-between items-start w-full">
        <div
          className={`p-2 rounded-xl transition-all duration-500 shadow-lg ${
            hasActivityToday
              ? "bg-[var(--brand-primary)] text-black shadow-[0_0_20px_rgba(204,255,0,0.2)]"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {icon}
        </div>

        <div className="text-right">
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
            Today
          </p>
          <p
            className={`text-sm font-black italic tabular-nums transition-colors duration-500 ${
              hasActivityToday ? "text-white" : "text-slate-700"
            }`}
          >
            {hasActivityToday
              ? `+${formatValue(todayValue)}`
              : formatValue(todayValue)}
          </p>
        </div>
      </div>

      {/* CENTER SECTION: Label */}
      <div className="py-2">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em] group-hover:text-white transition-colors">
          {label}
        </p>
      </div>

      {/* BOTTOM SECTION: Weekly Cumulative */}
      <div className="w-full pt-3 border-t border-slate-800/40">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter mb-1">
              Weekly Total
            </p>
            <span className="text-xl font-black text-[var(--brand-primary)] italic leading-none tabular-nums tracking-tighter">
              {formatValue(weekValue)}
            </span>
          </div>
          {unit && (
            <span className="text-[8px] font-black text-slate-700 uppercase mb-0.5 group-hover:text-slate-500 transition-colors">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
