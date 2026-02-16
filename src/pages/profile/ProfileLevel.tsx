import { useAuth } from "../../context/AuthContext";
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

  // Filter to only show the athlete's current status in the list
  const currentLevelData = levels.find((l) => l.name === athlete.current_level);

  return (
    <SubPageLayout title="Level Details">
      <div className="flex-1 flex flex-col space-y-8 pb-10">
        {/* TOP STATUS SECTION */}
        <section className="text-center pt-4">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[var(--brand-primary)] opacity-20 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-[var(--bg-surface)] border border-slate-800 flex items-center justify-center">
              <Trophy
                size={48}
                className="text-[var(--brand-primary)]"
                fill="currentColor"
                fillOpacity={0.1}
              />
              <div className="absolute -top-2 -right-2 bg-[var(--brand-primary)] text-black w-10 h-10 rounded-xl flex items-center justify-center font-black italic border-4 border-[var(--bg-main)]">
                {athlete.current_level?.charAt(0)}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">
            {athlete.current_level}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">
            Current Athlete Status
          </p>
        </section>

        {/* PROGRESS CARD */}
        <section className="bg-[var(--bg-surface)] border border-slate-800 p-6 rounded-[2.5rem]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Total Points
              </p>
              <p className="text-3xl font-black italic text-[var(--text-main)]">
                {athlete.level_points}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-1">
                Next Rank
              </p>
              <p className="text-xl font-black italic text-slate-500">
                {athlete.level_end} PTS
              </p>
            </div>
          </div>

          <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-1000 shadow-[0_0_15px_var(--brand-primary)]"
              style={{ width: `${athlete.level_completion_percent}%` }}
            />
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-black italic uppercase text-slate-500">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-[var(--brand-primary)]" />
              <span>{athlete.points_remaining} PTS Remaining</span>
            </div>
            <span className="text-[var(--text-main)]">
              {athlete.level_completion_percent}% Complete
            </span>
          </div>
        </section>

        {/* CURRENT RANK ONLY */}
        {currentLevelData && (
          <section className="space-y-3">
            <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--brand-primary)] bg-[var(--brand-primary)]/5">
              <div className="flex items-center gap-4 text-[var(--text-main)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center text-black">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase italic tracking-wide">
                    {currentLevelData.name} Rank
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">
                    Active Milestone: {currentLevelData.points} PTS
                  </p>
                </div>
              </div>
              <span className="bg-[var(--brand-primary)] text-black text-[8px] font-black uppercase px-2 py-1 rounded-md">
                Active
              </span>
            </div>
          </section>
        )}

        {/* PROJECTED DATE */}
        {athlete.projected_next_level_date && (
          <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[2rem] flex items-center gap-4 mt-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-[var(--brand-primary)] border border-slate-800">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Estimated Rank Up
              </p>
              <p className="text-sm font-bold text-[var(--text-main)] uppercase italic">
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
