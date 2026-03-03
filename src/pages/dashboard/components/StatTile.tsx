import { type ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  todayValue: number;
  weekValue: number;
  unit?: string;
  isTime?: boolean;
  themeColor?: "brand" | "orange" | "yellow" | "blue" | "emerald" | "violet";
}

// Maps themeColor → CSS variable names defined in variables.css
const THEME_VARS: Record<
  NonNullable<StatTileProps["themeColor"]>,
  { text: string; bg: string; border: string; glow: string; aura: string }
> = {
  brand: {
    text: "var(--brand-primary)",
    bg: "var(--tile-brand-bg)",
    border: "var(--tile-brand-border)",
    glow: "var(--glow-primary)",
    aura: "var(--brand-primary)",
  },
  orange: {
    text: "var(--brand-streak)",
    bg: "var(--tile-orange-bg)",
    border: "var(--tile-orange-border)",
    glow: "var(--glow-streak)",
    aura: "var(--brand-streak)",
  },
  yellow: {
    text: "var(--brand-yellow)",
    bg: "var(--tile-yellow-bg)",
    border: "var(--tile-yellow-border)",
    glow: "var(--glow-yellow)",
    aura: "var(--brand-yellow)",
  },
  blue: {
    text: "var(--brand-blue)",
    bg: "var(--tile-blue-bg)",
    border: "var(--tile-blue-border)",
    glow: "var(--glow-blue)",
    aura: "var(--brand-blue)",
  },
  emerald: {
    text: "var(--brand-rest)",
    bg: "var(--tile-emerald-bg)",
    border: "var(--tile-emerald-border)",
    glow: "var(--glow-primary)",
    aura: "var(--brand-rest)",
  },
  violet: {
    text: "var(--brand-violet)",
    bg: "var(--tile-violet-bg)",
    border: "var(--tile-violet-border)",
    glow: "var(--glow-violet)",
    aura: "var(--brand-violet)",
  },
};

const formatValue = (val: number, isTime?: boolean) => {
  if (isTime) {
    const h = Math.floor(val / 60);
    const m = Math.floor(val % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return val?.toLocaleString() ?? "0";
};

export const StatTile = ({
  icon,
  label,
  todayValue,
  weekValue,
  unit,
  isTime,
  themeColor = "brand",
}: StatTileProps) => {
  const hasTodayActivity = todayValue > 0;
  const t = THEME_VARS[themeColor];

  return (
    <div
      className="group relative p-5 rounded-xl bg-bg-surface border border-border-color/40
                 overflow-hidden transition-all duration-500 card-glow"
      style={
        // Hover is JS-free — we apply the themed border via a CSS var on the element,
        // then a single CSS rule in variables.css handles the hover state.
        // For now, inline the hover via onMouseEnter/Leave would need JS.
        // Instead we set a data attribute and let CSS do the work:
        {
          "--tile-accent": t.text,
          "--tile-glow": t.glow,
        } as React.CSSProperties
      }
    >
      {/* Themed aura blob */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-[50px] opacity-20
                   transition-opacity duration-700 group-hover:opacity-40 pointer-events-none"
        style={{ backgroundColor: t.aura }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Icon & Label */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2 rounded-lg border transition-transform duration-500 group-hover:scale-110"
            style={{
              color: t.text,
              backgroundColor: t.bg,
              borderColor: t.border,
            }}
          >
            {icon}
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase italic tracking-[0.2em]">
            {label}
          </p>
        </div>

        {/* This Week value */}
        <div className="mb-6">
          <span className="text-[8px] font-black text-text-muted/40 uppercase italic tracking-widest block mb-1">
            This Week
          </span>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-black italic tracking-tighter text-text-main tabular-nums leading-none">
              {formatValue(weekValue, isTime)}
            </h3>
            {unit && !isTime && (
              <span className="text-[10px] font-black italic text-text-muted/30 uppercase">
                {unit}
              </span>
            )}
          </div>
        </div>

        {/* Today footer */}
        <div className="pt-4 border-t border-border-color/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-text-muted/40 uppercase italic tracking-widest">
              Today
            </span>
            <span
              className="text-sm font-black italic tabular-nums"
              style={{
                color: hasTodayActivity
                  ? "var(--text-main)"
                  : "color-mix(in srgb, var(--text-muted), transparent 70%)",
              }}
            >
              {hasTodayActivity ? formatValue(todayValue, isTime) : "---"}
            </span>
          </div>

          {hasTodayActivity && (
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: t.text,
                boxShadow: `0 0 6px 1px ${t.glow}`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
