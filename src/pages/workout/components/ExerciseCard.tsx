import React from "react";

// --- 1. STRICT INTERFACES ---

export interface LogRow {
  weight: number;
  reps: number;
  distance: number;
  duration: number;
}

interface ExerciseCardProps {
  name: string;
  rows: LogRow[];
  /**
   * Value formatter: Ensures numeric values are correctly formatted with units
   * fv(100, "kg") -> "100 KG"
   */
  fv: (v: string | number, unit?: string) => string;
}

// --- 2. COMPONENT ---

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  rows,
  fv,
}) => {
  /**
   * Column Detection Logic
   * Determines which columns to render based on data presence across all sets.
   */
  const hasWeight = rows.some((r) => r.weight > 0);
  const hasReps = rows.some((r) => r.reps > 0);
  const hasDistance = rows.some((r) => r.distance > 0);
  const hasDuration = rows.some((r) => r.duration > 0);

  // If no rows, don't render an empty shell
  if (rows.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Exercise Name - Only render if provided (allows reuse in history lists) */}
      {name && (
        <h3 className="text-xs font-black uppercase italic tracking-widest text-text-main px-1">
          {name}
        </h3>
      )}

      <div className="bg-bg-surface border border-border-color/50 rounded-2xl p-5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-color/30">
              <th className="w-12 pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted italic">
                Set
              </th>

              {hasWeight && (
                <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted italic">
                  Weight
                </th>
              )}

              {hasReps && (
                <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted italic">
                  Reps
                </th>
              )}

              {hasDistance && (
                <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted italic">
                  Dist
                </th>
              )}

              {hasDuration && (
                <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted italic">
                  Time
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border-color/10">
            {rows.map((r, i) => (
              <tr
                key={i}
                className="group hover:bg-brand-primary/5 transition-colors"
              >
                {/* SET NUMBER */}
                <td className="w-12 py-3.5 text-xs font-black text-text-muted opacity-40 tabular-nums">
                  {i + 1}
                </td>

                {/* WEIGHT COLUMN */}
                {hasWeight && (
                  <td className="py-3.5 text-sm font-black italic text-text-main tabular-nums">
                    {fv(r.weight, "kg")}
                  </td>
                )}

                {/* REPS COLUMN */}
                {hasReps && (
                  <td className="py-3.5 text-sm font-black italic text-text-main tabular-nums">
                    {fv(r.reps)}
                  </td>
                )}

                {/* DISTANCE COLUMN */}
                {hasDistance && (
                  <td className="py-3.5 text-sm font-black italic text-text-main tabular-nums">
                    {fv((r.distance / 1000).toFixed(2), "km")}
                  </td>
                )}

                {/* DURATION COLUMN */}
                {hasDuration && (
                  <td className="py-3.5 text-sm font-black italic text-text-main tabular-nums">
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
