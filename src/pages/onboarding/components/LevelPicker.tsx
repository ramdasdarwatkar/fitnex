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

  return (
    <div className="relative w-full h-75">
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
                className={`p-2.5 rounded-xl ${isActive ? "bg-brand-primary text-bg-main" : "bg-bg-main text-text-muted"}`}
              >
                {lvl.multiplier > 1.8 ? (
                  <Trophy size={18} />
                ) : lvl.multiplier > 1.2 ? (
                  <Star size={18} />
                ) : (
                  <Zap size={18} />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-[13px] font-black block uppercase italic tracking-tight leading-none ${isActive ? "text-brand-primary" : "text-text-main"}`}
                >
                  {lvl.level_name}
                </span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-glow-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />
    </div>
  );
};
