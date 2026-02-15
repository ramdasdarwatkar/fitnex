import { Trophy, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useUI } from "../../../context/UIContext";
import { useEffect, useState } from "react";
import { db } from "../../../db/database";
import type { AthleteProgress } from "../../../types/database.types";

export const DashboardHeader = () => {
  const { profile, user_id } = useAuth();
  const { openSidebar } = useUI();
  const [progress, setProgress] = useState<AthleteProgress | null>(null);

  // Time-aware interactive greetings to make the app feel "aware"
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  };

  useEffect(() => {
    const loadProgress = async () => {
      if (user_id) {
        const data = await db.athlete_progress.get(user_id);
        if (data) setProgress(data);
      }
    };
    loadProgress();
  }, [user_id]);

  // Format name to Title Case (e.g., "John" instead of "JOHN")
  const displayName = profile?.name
    ? profile.name.split(" ")[0].charAt(0).toUpperCase() +
      profile.name.split(" ")[0].slice(1).toLowerCase()
    : "Athlete";

  return (
    <header className="pt-4 pb-4 space-y-6 ios-no-top">
      {/* Top Row: Greeting & Calendar */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5 text-brand font-black italic text-[11px] uppercase tracking-widest animate-pulse">
            <Sparkles size={12} strokeWidth={3} />
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {displayName}!
          </h1>
        </div>

        <button className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
          <Calendar size={22} />
        </button>
      </div>

      {/* Athlete Profile Card - Kept exactly as your original */}
      <button
        onClick={openSidebar}
        className="w-full bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 p-5 rounded-[2.5rem] text-left transition-all active:scale-[0.98]"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-xl">
              <Trophy size={20} className="text-brand" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                Athlete Rank
              </p>
              <p className="text-lg font-black text-white uppercase italic">
                {progress?.current_level || "Novice"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Points
            </p>
            <p className="text-lg font-black text-brand italic">
              {progress?.level_points || 0}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
            <span className="text-slate-400">Progress to next rank</span>
            <span className="text-brand">
              {progress?.level_completion_percent || 0}%
            </span>
          </div>
          <div className="h-2 w-full bg-black rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-1000 shadow-[0_0_12px_#0ea5e9]"
              style={{ width: `${progress?.level_completion_percent || 0}%` }}
            />
          </div>
        </div>
      </button>
    </header>
  );
};
