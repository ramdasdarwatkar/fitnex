import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { AthleteLevelsLookup } from "../../../types/database.types";
import { Trophy, Zap, Star } from "lucide-react";

interface Props {
  value: string;
  onChange: (levelName: string, minPoints: number) => void;
}

export const LevelPicker = ({ value, onChange }: Props) => {
  const [levels, setLevels] = useState<AthleteLevelsLookup[]>([]);

  useEffect(() => {
    const fetchLevels = async () => {
      const { data } = await supabase
        .from("athlete_levels_lookup")
        .select("*")
        .eq("status", true)
        .order("display_order", { ascending: true });
      if (data) setLevels(data);
    };
    fetchLevels();
  }, []);

  const formatExperience = (points: number) => {
    const totalDays = Math.floor(points / 2);
    if (totalDays === 0) return "Beginner";
    if (totalDays < 30)
      return `${totalDays} Day${totalDays > 1 ? "s" : ""} Experience`;
    const totalMonths = Math.floor(totalDays / 30.44);
    if (totalMonths < 12)
      return `${totalMonths} Month${totalMonths > 1 ? "s" : ""} Experience`;
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    return remainingMonths === 0
      ? `${years} Year${years > 1 ? "s" : ""} Experience`
      : `${years}y ${remainingMonths}m Experience`;
  };

  return (
    <div className="relative w-full h-95">
      <div className="h-full overflow-y-auto pr-2 space-y-3 no-scrollbar pb-10">
        {levels.map((lvl) => {
          const isActive = value === lvl.level_name;
          return (
            <button
              key={lvl.id}
              onClick={() => onChange(lvl.level_name, lvl.min_points)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.98] text-left ${
                isActive
                  ? "border-brand-primary bg-brand-primary/10 shadow-md shadow-brand-primary/5"
                  : "border-border-color bg-bg-surface"
              }`}
            >
              <div
                className={`p-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-brand-primary text-bg-main"
                    : "bg-bg-main text-text-muted"
                }`}
              >
                {lvl.multiplier > 1.8 ? (
                  <Trophy size={20} />
                ) : lvl.multiplier > 1.2 ? (
                  <Star size={20} />
                ) : (
                  <Zap size={20} />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-[13px] font-black block uppercase italic tracking-tight leading-none mb-1 ${
                    isActive ? "text-brand-primary" : "text-text-main"
                  }`}
                >
                  {lvl.level_name}
                </span>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                  {formatExperience(lvl.min_points)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {/* Dynamic gradient that matches your theme background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />
    </div>
  );
};
