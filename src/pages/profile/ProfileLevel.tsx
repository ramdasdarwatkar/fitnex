import { useAuth } from "../../hooks/useAuth";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { Trophy, Star, Award, TrendingUp } from "lucide-react";

export const ProfileLevel = () => {
  const { athlete } = useAuth();

  if (!athlete) return null;

  const levels = [
    { name: "Starter", points: "0-100", min: 0 },
    { name: "Novice", points: "101-500", min: 101 },
    { name: "Warrior", points: "501-2000", min: 501 },
    { name: "Elite", points: "2001+", min: 2001 },
  ];

  // Logic to find current level details
  const currentLevelData = levels.find((l) => l.name === athlete.current_level);

  return (
    <SubPageLayout title="Level Details">
      <div className="flex-1 flex flex-col space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* TOP STATUS SECTION */}
        <section className="text-center pt-4">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-brand-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-bg-surface border border-border-color flex items-center justify-center shadow-2xl">
              <Trophy
                size={48}
                className="text-brand-primary"
                fill="currentColor"
                fillOpacity={0.1}
              />
              <div className="absolute -top-2 -right-2 bg-brand-primary text-black w-10 h-10 rounded-xl flex items-center justify-center font-black italic border-4 border-bg-main shadow-lg">
                {athlete.current_level?.charAt(0)}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-text-main">
            {athlete.current_level}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mt-2 italic">
            Current Athlete Status
          </p>
        </section>

        {/* PROGRESS CARD */}
        <section className="bg-bg-surface border border-border-color p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-end mb-6 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
                Total Points
              </p>
              <p className="text-3xl font-black italic text-text-main tabular-nums">
                {athlete.level_points}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">
                Next Rank
              </p>
              <p className="text-xl font-black italic text-text-muted tabular-nums">
                {athlete.level_end} <span className="text-[10px]">PTS</span>
              </p>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="h-3 w-full bg-bg-main rounded-full overflow-hidden border border-border-color/50 p-0.5">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]"
              style={{ width: `${athlete.level_completion_percent}%` }}
            />
          </div>

          <div className="mt-5 flex justify-between items-center text-[10px] font-black italic uppercase text-text-muted px-1">
            <div className="flex items-center gap-2">
              <Star
                size={12}
                className="text-brand-primary"
                fill="currentColor"
              />
              <span>{athlete.points_remaining} PTS Remaining</span>
            </div>
            <span className="text-text-main bg-bg-main px-2 py-0.5 rounded-md border border-border-color/30">
              {athlete.level_completion_percent}% Complete
            </span>
          </div>
        </section>

        {/* RANK DETAILS */}
        {currentLevelData && (
          <section className="space-y-3">
            <div className="flex items-center justify-between p-5 rounded-[1.8rem] border border-brand-primary/30 bg-brand-primary/5">
              <div className="flex items-center gap-4 text-text-main">
                <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-black shadow-lg shadow-brand-primary/20">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase italic tracking-wide">
                    {currentLevelData.name} Rank
                  </p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-tight">
                    Active Milestone: {currentLevelData.points} PTS
                  </p>
                </div>
              </div>
              <span className="bg-brand-primary text-black text-[8px] font-black uppercase px-2 py-1 rounded-md italic">
                Active
              </span>
            </div>
          </section>
        )}

        {/* PROJECTION CARD */}
        {athlete.projected_next_level_date && (
          <div className="bg-bg-surface border border-border-color p-5 rounded-4xl flex items-center gap-4 shadow-md group">
            <div className="w-10 h-10 rounded-2xl bg-bg-main flex items-center justify-center text-brand-primary border border-border-color group-hover:border-brand-primary/40 transition-colors">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5">
                Estimated Rank Up
              </p>
              <p className="text-sm font-bold text-text-main uppercase italic">
                Around{" "}
                {new Date(athlete.projected_next_level_date).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" },
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1" />
      </div>
    </SubPageLayout>
  );
};
