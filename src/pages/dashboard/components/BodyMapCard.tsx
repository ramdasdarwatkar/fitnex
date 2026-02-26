import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BodyMap } from "./BodyMap";
import { MuscleService } from "../../../services/MuscleService";

interface BodyMapCardProps {
  muscleNames?: string;
}

export const BodyMapCard = ({ muscleNames = "" }: BodyMapCardProps) => {
  // 1. Fetch data stable array
  const orphanMusclesRaw = useLiveQuery(
    () => MuscleService.getOrphanMuscles(),
    [],
    [],
  );

  // 2. Full list for the SVG
  const rawMuscleList = useMemo(() => {
    const names = muscleNames || "";
    return names
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
  }, [muscleNames]);

  // 3. Filtered list for the UI labels
  const displayList = useMemo(() => {
    const muscles = orphanMusclesRaw;
    if (!muscles || muscles.length === 0 || rawMuscleList.length === 0)
      return [];

    const orphanSet = new Set(muscles.map((m) => m.toLowerCase()));
    const filtered = rawMuscleList.filter((m) => orphanSet.has(m));

    return Array.from(new Set(filtered));
  }, [rawMuscleList, orphanMusclesRaw]);

  return (
    <div className="bg-bg-surface border border-border-color rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden group self-start h-full">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 mb-2 w-full">
        {/* REFACTORED: Used shadow-glow-primary token */}
        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse shadow-glow-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
          Muscle Load
        </h3>
      </div>

      {/* BODY MAP SVG CONTAINER */}
      <div className="w-full max-w-[320px] transition-transform duration-700 group-hover:scale-[1.02] flex justify-center items-center aspect-[1/1.2] overflow-hidden">
        <BodyMap muscles={rawMuscleList} />
      </div>

      {/* MUSCLE TAGS GRID */}
      {displayList.length > 0 && (
        <div className="w-full mt-2 border-t border-border-color/50 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {displayList.map((muscle) => (
              <div key={muscle} className="relative group/tag">
                {/* REFACTORED: bg-bg-surface-soft token used */}
                <div className="absolute inset-0 bg-bg-surface-soft -skew-x-12 rounded-lg border border-border-color group-hover/tag:border-brand-primary/50 transition-all" />

                <div className="relative px-3 py-2 flex items-center gap-2">
                  {/* REFACTORED: Custom primary glow on hover */}
                  <div className="w-1 h-1 rounded-full bg-text-muted group-hover/tag:bg-brand-primary transition-colors group-hover/tag:shadow-glow-primary" />
                  <span className="text-[10px] font-black uppercase text-text-muted group-hover/tag:text-text-main truncate transition-colors">
                    {muscle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
