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
    <div className="bg-bg-surface border border-border-color p-5 rounded-[2.2rem] flex flex-col justify-between min-h-38.75 group transition-all duration-300 hover:border-brand-primary/30">
      <div className="flex justify-between items-start w-full">
        <div
          className={`p-2 rounded-xl transition-all duration-500 shadow-lg ${
            hasActivityToday
              ? "bg-brand-primary text-black shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]"
              : "bg-bg-surface-soft text-text-muted"
          }`}
        >
          {icon}
        </div>

        <div className="text-right">
          <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-0.5">
            Today
          </p>
          <p
            className={`text-sm font-black italic tabular-nums transition-colors duration-500 ${
              hasActivityToday ? "text-text-main" : "text-text-muted/30"
            }`}
          >
            {hasActivityToday
              ? `+${formatValue(todayValue)}`
              : formatValue(todayValue)}
          </p>
        </div>
      </div>

      <p className="text-[9px] font-black uppercase text-text-muted tracking-[0.15em] group-hover:text-text-main transition-colors">
        {label}
      </p>

      <div className="w-full pt-3 border-t border-border-color/40">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[7px] font-black text-text-muted/60 uppercase tracking-tighter mb-1">
              Weekly Total
            </p>
            <span className="text-xl font-black text-brand-primary italic leading-none tabular-nums tracking-tighter">
              {formatValue(weekValue)}
            </span>
          </div>
          {unit && (
            <span className="text-[8px] font-black text-text-muted uppercase mb-0.5">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
