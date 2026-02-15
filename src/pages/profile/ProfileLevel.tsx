import { useAuth } from "../../context/AuthContext";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { Trophy, Star, Award, Lock, TrendingUp } from "lucide-react";

export const ProfileLevel = () => {
  const { athlete } = useAuth();

  if (!athlete) return null;

  return (
    <SubPageLayout title="Level Details">
      <div className="space-y-8 pb-10 bg-[var(--bg-main)]">
        <section className="text-center pt-4">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[var(--brand-primary)] opacity-20 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center">
              <Trophy
                size={48}
                className="text-[var(--brand-primary)]"
                fill="currentColor"
                fillOpacity={0.1}
              />
              <div className="absolute -top-2 -right-2 bg-[var(--brand-primary)] text-[var(--bg-main)] w-10 h-10 rounded-xl flex items-center justify-center font-black italic border-4 border-[var(--bg-main)]">
                {athlete.current_level?.charAt(0)}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">
            {athlete.current_level}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mt-2">
            Current Athlete Status
          </p>
        </section>

        <section className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.5rem]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
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
              <p className="text-xl font-black italic text-[var(--text-muted)]">
                {athlete.level_end} PTS
              </p>
            </div>
          </div>

          <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-1000 shadow-[0_0_15px_var(--brand-primary)]"
              style={{ width: `${athlete.level_completion_percent}%` }}
            />
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-black italic uppercase text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-[var(--brand-primary)]" />
              <span>{athlete.points_remaining} PTS Remaining</span>
            </div>
            <span className="text-[var(--text-main)]">
              {athlete.level_completion_percent}% Complete
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <LevelRow
            level="Starter"
            points="0-100"
            isReached={true}
            isCurrent={athlete.current_level === "Starter"}
          />
          <LevelRow
            level="Novice"
            points="101-500"
            isReached={athlete.level_points! > 100}
            isCurrent={athlete.current_level === "Novice"}
          />
          <LevelRow
            level="Warrior"
            points="501-2000"
            isReached={athlete.level_points! > 500}
            isCurrent={athlete.current_level === "Warrior"}
          />
          <LevelRow
            level="Elite"
            points="2001+"
            isReached={athlete.level_points! > 2000}
            isCurrent={athlete.current_level === "Elite"}
          />
        </section>

        {athlete.projected_next_level_date && (
          <div className="bg-[var(--bg-surface)] border border-[var(--brand-primary)] border-opacity-30 p-5 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[var(--brand-primary)] bg-opacity-10 flex items-center justify-center text-[var(--text-main)]">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--brand-primary)]">
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
      </div>
    </SubPageLayout>
  );
};

const LevelRow = ({ level, points, isReached, isCurrent }: any) => (
  <div
    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
      isCurrent
        ? "bg-[var(--brand-primary)] bg-opacity-10 border-[var(--brand-primary)]"
        : isReached
          ? "bg-[var(--bg-surface)] border-[var(--border-color)] opacity-60"
          : "bg-[var(--bg-main)] border-[var(--border-color)] opacity-30"
    }`}
  >
    <div className="flex items-center gap-4 text-[var(--text-main)]">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isReached ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]"}`}
      >
        {isReached ? <Award size={18} /> : <Lock size={18} />}
      </div>
      <div>
        <p className="text-xs font-black uppercase italic tracking-wide">
          {level}
        </p>
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">
          {points} PTS
        </p>
      </div>
    </div>
    {isCurrent && (
      <span className="bg-[var(--brand-primary)] text-[var(--bg-main)] text-[8px] font-black uppercase px-2 py-1 rounded-md">
        Current
      </span>
    )}
  </div>
);
