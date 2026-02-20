import React from "react";

interface LogRow {
  weight: number;
  reps: number;
  distance: number;
  duration: number;
}

interface ExerciseCardProps {
  name: string;
  rows: LogRow[];
  fv: (v: any, u?: string) => string; // Formatting helper passed from parent
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  rows,
  fv,
}) => {
  // Determine which columns to show based on the data present in this specific exercise
  const hasWeight = rows.some((r) => r.weight > 0);
  const hasReps = rows.some((r) => r.reps > 0);
  const hasDistance = rows.some((r) => r.distance > 0);
  const hasDuration = rows.some((r) => r.duration > 0);

  return (
    <div className="space-y-3">
      <h3 className="font-black text-white">{name}</h3>
      <div className="bg-slate-900/40 rounded-xl p-4 text-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="w-12 pb-3 uppercase text-[10px] text-slate-500 font-bold">
                Set
              </th>
              {hasWeight && (
                <th className="pb-3 uppercase text-[10px] text-slate-500 font-bold">
                  Weight
                </th>
              )}
              {hasReps && (
                <th className="pb-3 uppercase text-[10px] text-slate-500 font-bold">
                  Reps
                </th>
              )}
              {hasDistance && (
                <th className="pb-3 uppercase text-[10px] text-slate-500 font-bold">
                  Distance
                </th>
              )}
              {hasDuration && (
                <th className="pb-3 uppercase text-[10px] text-slate-500 font-bold">
                  Duration
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="h-2"></tr>
            {rows.map((r, i) => (
              <tr key={i} className="h-8">
                <td className="w-12 align-middle text-slate-400">{i + 1}</td>
                {hasWeight && (
                  <td className="align-middle font-medium">
                    {fv(r.weight, "kg")}
                  </td>
                )}
                {hasReps && (
                  <td className="align-middle font-medium">{fv(r.reps)}</td>
                )}
                {hasDistance && (
                  <td className="align-middle font-medium">
                    {fv((r.distance / 1000).toFixed(2), "km")}
                  </td>
                )}
                {hasDuration && (
                  <td className="align-middle font-medium">
                    {fv(Math.floor(r.duration / 60), "min")}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
