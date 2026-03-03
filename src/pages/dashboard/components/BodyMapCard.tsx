import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BodyMap } from "./BodyMap";
import { MuscleService } from "../../../services/MuscleService";

interface BodyMapCardProps {
  muscleNames?: string;
}

export const BodyMapCard = ({ muscleNames = "" }: BodyMapCardProps) => {
  const orphanMusclesRaw = useLiveQuery(
    () => MuscleService.getOrphanMuscles(),
    [],
    [],
  );

  const rawMuscleList = useMemo(() => {
    return (muscleNames || "")
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
  }, [muscleNames]);

  const displayList = useMemo(() => {
    const muscles = orphanMusclesRaw;
    if (!muscles || muscles.length === 0 || rawMuscleList.length === 0)
      return [];
    const orphanSet = new Set(muscles.map((m) => m.toLowerCase()));
    return Array.from(new Set(rawMuscleList.filter((m) => orphanSet.has(m))));
  }, [rawMuscleList, orphanMusclesRaw]);

  return (
    // No bg/border/rounded — Dashboard wrapper card provides that
    <div className="relative flex flex-col items-center h-full p-6 overflow-hidden group">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-2 mb-4 w-full">
        <div
          className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"
          style={{ boxShadow: "0 0 6px 2px var(--glow-primary)" }}
        />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-text-muted">
          Muscle Load
        </h3>
      </div>

      {/* ── BODY MAP ── */}
      <div className="w-full max-w-70 flex justify-center items-center aspect-[1/1.25] overflow-hidden py-2 transition-transform duration-700 group-hover:scale-[1.03]">
        <BodyMap muscles={rawMuscleList} />
      </div>

      {/* ── MUSCLE TAGS ── */}
      {displayList.length > 0 && (
        <div className="w-full mt-auto pt-4 border-t border-border-color/20">
          <div className="grid grid-cols-2 gap-2">
            {displayList.map((muscle) => (
              <div key={muscle} className="muscle-tag">
                <div className="muscle-tag-bg" />
                <div className="relative flex items-center gap-2 px-3 py-2">
                  <div className="muscle-tag-dot" />
                  <span className="muscle-tag-label">{muscle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
