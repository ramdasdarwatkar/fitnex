import { useMemo } from "react";
import { BodyMap } from "./BodyMap";

interface BodyMapCardProps {
  muscleNames?: string; // Expecting "Chest, Biceps, Quads, Lats, Triceps"
}

export const BodyMapCard = ({ muscleNames = "" }: BodyMapCardProps) => {
  const muscleList = useMemo(() => {
    if (!muscleNames || typeof muscleNames !== "string") return [];
    return muscleNames
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  }, [muscleNames]);

  // Split the list into two columns for the sides
  const half = Math.ceil(muscleList.length / 2);
  const leftSide = muscleList.slice(0, half);
  const rightSide = muscleList.slice(half);

  return (
    <div className="lg:col-span-5 dashboard-card bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group min-h-[320px]">
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
          Muscle Load
        </h3>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Left Side Labels */}
        <div className="hidden sm:flex flex-col gap-2 w-24">
          {leftSide.map((muscle) => (
            <MuscleTag key={muscle} name={muscle} align="left" />
          ))}
        </div>

        {/* Center: The Map */}
        <div className="flex-1 max-w-[180px] transition-transform duration-700 group-hover:scale-[1.05]">
          <BodyMap muscles={muscleList.map((m) => m.toLowerCase())} />
        </div>

        {/* Right Side Labels */}
        <div className="hidden sm:flex flex-col gap-2 w-24">
          {rightSide.map((muscle) => (
            <MuscleTag key={muscle} name={muscle} align="right" />
          ))}
        </div>
      </div>

      {/* Mobile Only: Horizontal list if screen is small */}
      <div className="flex sm:hidden flex-wrap justify-center gap-2 mt-4">
        {muscleList.map((muscle) => (
          <span
            key={muscle}
            className="text-[8px] font-black uppercase px-2 py-1 bg-slate-800 rounded-full text-slate-400"
          >
            {muscle}
          </span>
        ))}
      </div>
    </div>
  );
};

const MuscleTag = ({
  name,
  align,
}: {
  name: string;
  align: "left" | "right";
}) => (
  <div
    className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}
  >
    <span className="text-[9px] font-black uppercase italic text-white leading-none truncate w-full">
      {name}
    </span>
    <div
      className={`h-[1px] w-4 mt-1 bg-gradient-to-r ${
        align === "right"
          ? "from-transparent to-slate-700"
          : "from-slate-700 to-transparent"
      }`}
    />
  </div>
);
