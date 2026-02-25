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
  const hasActivity = todayValue > 0;

  const formatValue = (val: number) => {
    if (isTime) {
      const h = Math.floor(val / 60);
      const m = Math.floor(val % 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return val?.toLocaleString() ?? "0";
  };

  return (
    <div className="glass-card group relative p-6 rounded-4xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/40">
      {/* Background Decorative Element */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />

      <div className="relative z-10 space-y-6">
        {/* Header: Label & Icon */}
        <div className="flex items-center justify-between">
          <div
            className={`p-2 rounded-xl border transition-all duration-500 ${
              hasActivity
                ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary pro-shadow"
                : "bg-bg-surface-soft border-border-color text-text-muted"
            }`}
          >
            {icon}
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${hasActivity ? "text-brand-primary" : "text-text-muted"}`}
          >
            {hasActivity ? "Active" : "Stable"}
          </span>
        </div>

        {/* Middle: Main Stat */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black tracking-tighter text-text-main leading-none">
              {formatValue(weekValue)}
            </h3>
            {unit && !isTime && (
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                {unit}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Today's Progress Bar */}
        <div className="pt-4 border-t border-border-color/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] font-black text-text-muted uppercase">
              Today
            </span>
            <span
              className={`text-[10px] font-black tabular-nums ${hasActivity ? "text-brand-primary" : "text-text-muted/40"}`}
            >
              {hasActivity ? `+${formatValue(todayValue)}` : "0"}
            </span>
          </div>
          {/* Progress Visualizer */}
          <div className="h-1 w-full bg-bg-surface-soft rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${hasActivity ? "bg-brand-primary shadow-glow-primary" : "bg-text-muted/20"}`}
              style={{ width: hasActivity ? "65%" : "0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
