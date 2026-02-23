import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BodyMap } from "./BodyMap";
import { LibraryService } from "../../../services/LibraryService";

interface BodyMapCardProps {
  muscleNames?: string;
}

export const BodyMapCard = ({ muscleNames = "" }: BodyMapCardProps) => {
  // 1. Fetch data. We remove the logical OR here to keep the variable stable.
  // The second argument '[]' in useLiveQuery acts as the initial value.
  const orphanMusclesRaw = useLiveQuery(
    () => LibraryService.getOrphanMuscles(),
    [],
    [], // This ensures orphanMusclesRaw is always an array, never undefined
  );

  // 2. Full list for the SVG
  const rawMuscleList = useMemo(() => {
    const names = muscleNames || "";
    return names
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
  }, [muscleNames]);

  // 3. Filtered list for the UI
  // We handle the array check inside the memo to satisfy the compiler's safety rules.
  const displayList = useMemo(() => {
    const muscles = orphanMusclesRaw;
    if (!muscles || muscles.length === 0 || rawMuscleList.length === 0)
      return [];

    const orphanSet = new Set(muscles.map((m) => m.toLowerCase()));
    const filtered = rawMuscleList.filter((m) => orphanSet.has(m));

    // Return unique values only
    return Array.from(new Set(filtered));
  }, [rawMuscleList, orphanMusclesRaw]);

  return (
    <div className="bg-bg-surface border border-border-color rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden group self-start h-full">
      <div className="flex items-center gap-2 mb-2 w-full">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.8)]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">
          Muscle Load
        </h3>
      </div>

      <div className="w-full max-w-[320px] transition-transform duration-700 group-hover:scale-[1.02] flex justify-center items-center aspect-[1/1.2] overflow-hidden">
        <BodyMap muscles={rawMuscleList} />
      </div>

      {displayList.length > 0 && (
        <div className="w-full mt-2 border-t border-border-color/50 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {displayList.map((muscle) => (
              <div key={muscle} className="relative group/tag">
                <div className="absolute inset-0 bg-bg-surface-soft -skew-x-12 rounded-lg border border-border-color group-hover/tag:border-brand-primary/50 transition-all" />
                <div className="relative px-3 py-2 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-text-muted group-hover/tag:bg-brand-primary transition-colors shadow-[0_0_5px_rgba(var(--brand-primary-rgb),0.5)]" />
                  <span className="text-[10px] font-black uppercase italic text-text-muted group-hover/tag:text-text-main truncate transition-colors">
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
