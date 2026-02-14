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
    <div className="relative w-full h-[380px]">
      <div className="h-full overflow-y-auto pr-2 space-y-4 no-scrollbar pb-10">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => onChange(lvl.level_name, lvl.min_points)}
            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all active:scale-95 text-left ${value === lvl.level_name ? "border-brand bg-brand/10 shadow-lg" : "border-slate-800 bg-slate-900/40"}`}
          >
            <div
              className={`p-3 rounded-2xl ${value === lvl.level_name ? "bg-brand text-white" : "bg-slate-800 text-slate-500"}`}
            >
              {lvl.multiplier > 1.8 ? (
                <Trophy size={24} />
              ) : lvl.multiplier > 1.2 ? (
                <Star size={24} />
              ) : (
                <Zap size={24} />
              )}
            </div>
            <div className="flex-1">
              <span
                className={`text-lg font-black block uppercase tracking-tight ${value === lvl.level_name ? "text-white" : "text-slate-300"}`}
              >
                {lvl.level_name}
              </span>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {formatExperience(lvl.min_points)}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
};
