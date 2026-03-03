import { useAuth } from "../../hooks/useAuth";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { Trophy, Star, Award, TrendingUp } from "lucide-react";

const LEVELS = [
  { name: "Starter", points: "0–100", min: 0 },
  { name: "Novice", points: "101–500", min: 101 },
  { name: "Warrior", points: "501–2000", min: 501 },
  { name: "Elite", points: "2001+", min: 2001 },
];

export const ProfileLevel = () => {
  const { athlete } = useAuth();
  if (!athlete) return null;

  const currentLevelData = LEVELS.find((l) => l.name === athlete.current_level);

  return (
    <SubPageLayout title="Rank Progress">
      <div className="space-y-6 pt-2 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── HERO RANK ── */}
        <section className="flex flex-col items-center text-center pt-4">
          <div className="relative inline-block mb-6 group">
            {/* Ambient glow blob */}
            <div
              className="absolute inset-0 bg-brand-primary opacity-20 blur-3xl rounded-full
                            group-hover:opacity-35 transition-opacity duration-700 pointer-events-none"
            />

            {/* Trophy container */}
            <div
              className="relative w-32 h-32 rounded-2xl bg-bg-surface border border-border-color/40
                         flex items-center justify-center card-glow
                         transition-transform duration-500 group-hover:scale-105"
            >
              <Trophy
                size={60}
                className="text-brand-primary"
                fill="currentColor"
                fillOpacity={0.12}
              />

              {/* Level initial badge */}
              <div
                className="absolute -top-3 -right-3 w-11 h-11 rounded-xl bg-brand-primary
                           flex items-center justify-center text-xl font-black italic
                           border-[3px] border-bg-main"
                style={{
                  color: "var(--color-on-brand)",
                  boxShadow: "0 0 14px var(--glow-primary)",
                }}
              >
                {athlete.current_level?.charAt(0)}
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-text-main leading-none">
            {athlete.current_level}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary/80 mt-3 italic">
            System Rank — Active
          </p>
        </section>

        {/* ── PROGRESS CARD ── */}
        <section className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 card-glow">
          {/* Points header */}
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase italic tracking-widest text-text-muted/50">
                Total Accrued
              </p>
              <p className="text-4xl font-black italic text-text-main tabular-nums tracking-tighter">
                {athlete.level_points?.toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black uppercase italic tracking-widest text-brand-primary/70">
                Next Evolution
              </p>
              <p className="text-2xl font-black italic text-text-muted/40 tabular-nums tracking-tight">
                {athlete.level_end?.toLocaleString()}
                <span className="text-[9px] ml-1 tracking-normal font-black">
                  pts
                </span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3.5 w-full bg-bg-main rounded-full overflow-hidden border border-border-color/20 p-[3px]">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-[1200ms] ease-out relative overflow-hidden"
              style={{
                width: `${athlete.level_completion_percent}%`,
                boxShadow: "0 0 8px var(--glow-primary)",
              }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Bar footer */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star
                size={12}
                className="text-brand-primary animate-pulse"
                fill="currentColor"
              />
              <span className="text-[9px] font-black uppercase italic tracking-widest text-text-muted/50">
                {athlete.points_remaining?.toLocaleString()} pts remaining
              </span>
            </div>
            <span
              className="text-[9px] font-black italic text-brand-primary
                         bg-brand-primary/10 px-3 py-1.5 rounded-xl
                         border border-brand-primary/20"
            >
              {athlete.level_completion_percent}% calibrated
            </span>
          </div>
        </section>

        {/* ── ACTIVE MILESTONE ── */}
        {currentLevelData && (
          <div
            className="relative p-5 rounded-2xl border border-brand-primary/25
                       bg-brand-primary/[0.04] overflow-hidden
                       active:scale-[0.98] transition-all group"
          >
            {/* Decorative blob */}
            <div
              className="absolute -right-4 -top-4 w-20 h-20 bg-brand-primary opacity-[0.06]
                            blur-2xl rounded-full pointer-events-none"
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center
                             transition-transform duration-300 group-hover:rotate-6 shrink-0"
                  style={{
                    color: "var(--color-on-brand)",
                    boxShadow: "0 0 16px var(--glow-primary)",
                  }}
                >
                  <Award size={22} strokeWidth={2.5} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[13px] font-black uppercase italic tracking-tight text-text-main leading-none">
                    {currentLevelData.name} Achievement
                  </p>
                  <p className="text-[9px] font-black text-text-muted/50 uppercase italic tracking-widest">
                    {currentLevelData.points} pts
                  </p>
                </div>
              </div>

              <span
                className="text-[9px] font-black uppercase italic px-3 py-1.5 rounded-xl
                           bg-brand-primary animate-pulse"
                style={{
                  color: "var(--color-on-brand)",
                  boxShadow: "0 0 12px var(--glow-primary)",
                }}
              >
                Active
              </span>
            </div>
          </div>
        )}

        {/* ── FORECAST ── */}
        {athlete.projected_next_level_date && (
          <div
            className="bg-bg-surface border border-border-color/40 rounded-2xl p-5
                       flex items-center gap-4 card-glow
                       active:scale-[0.98] transition-all group"
          >
            <div
              className="w-11 h-11 rounded-xl bg-bg-main border border-border-color/40
                         flex items-center justify-center text-brand-primary shrink-0
                         group-hover:border-brand-primary/40 transition-colors duration-300"
            >
              <TrendingUp size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase italic tracking-[0.25em] text-text-muted/40">
                Projected Rank Up
              </p>
              <p className="text-lg font-black text-text-main uppercase italic tracking-tighter">
                {new Date(athlete.projected_next_level_date).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" },
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};
