import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BodyMap } from "./BodyMap";
import { LibraryService } from "../../../services/LibraryService";

interface BodyMapCardProps {
  muscleNames?: string;
}

export const BodyMapCard = ({ muscleNames = "" }: BodyMapCardProps) => {
  // 1. Fetch Orphan Master List from Library Service
  const orphanMuscles = useLiveQuery(
    () => LibraryService.getOrphanMuscles(),
    [],
  );

  // 2. Full list for the SVG (Highlights specific sub-muscles)
  const rawMuscleList = useMemo(() => {
    if (!muscleNames) return [];
    return muscleNames
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
  }, [muscleNames]);

  // 3. Filtered list for the Stylish UI (Matches against the Orphan list)
  const displayList = useMemo(() => {
    if (!orphanMuscles || orphanMuscles.length === 0) return [];

    // Use a Set for faster O(1) lookups during filtering
    const orphanSet = new Set(orphanMuscles);

    return rawMuscleList.filter((m) => orphanSet.has(m));
  }, [rawMuscleList, orphanMuscles]);

  return (
    <div className="lg:col-span-5 dashboard-card bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden group self-start">
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-2 w-full">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
          Muscle Load
        </h3>
      </div>

      {/* Center: The Map - Scaled and Centered */}
      <div className="w-full max-w-[320px] transition-transform duration-700 group-hover:scale-[1.02] flex justify-center items-center">
        <div className="w-full aspect-[1/1.2] flex justify-center items-center overflow-hidden">
          {/* SVG highlights everything passed from the DB */}
          <BodyMap muscles={rawMuscleList} />
        </div>
      </div>

      {/* Bottom: Stylish Muscle Grid - Filtered to Orphans only */}
      {displayList.length > 0 && (
        <div className="w-full mt-2 border-t border-slate-800/50 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {displayList.map((muscle) => (
              <StylishMuscleTag key={muscle} name={muscle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Stylish Badge for filtered orphan muscles
 */
const StylishMuscleTag = ({ name }: { name: string }) => (
  <div className="relative group/tag cursor-default">
    {/* Skewed Background Overlay */}
    <div className="absolute inset-0 bg-slate-800/40 -skew-x-12 rounded-lg border border-slate-700/50 group-hover/tag:border-[var(--brand-primary)] group-hover/tag:bg-[var(--brand-primary)]/10 transition-all duration-300" />

    <div className="relative px-3 py-2 flex items-center gap-2">
      {/* Mini indicator dot */}
      <div className="w-1 h-1 rounded-full bg-slate-600 group-hover/tag:bg-[var(--brand-primary)] shadow-[0_0_5px_var(--brand-primary)] transition-colors" />

      <span className="text-[10px] font-black uppercase italic text-slate-300 group-hover/tag:text-white tracking-tighter transition-colors truncate">
        {name}
      </span>
    </div>
  </div>
);
