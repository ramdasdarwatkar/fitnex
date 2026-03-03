import React from "react";

// --- INTERFACES ---

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
   * Value formatter: fv(100, "kg") -> "100 KG"
   */
  fv: (v: string | number, unit?: string) => string;
}

// --- COMPONENT ---

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  rows,
  fv,
}) => {
  const hasWeight = rows.some((r) => r.weight > 0);
  const hasReps = rows.some((r) => r.reps > 0);
  const hasDistance = rows.some((r) => r.distance > 0);
  const hasDuration = rows.some((r) => r.duration > 0);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Exercise name */}
      {name && (
        <h3 className="text-xs font-black uppercase italic tracking-widest text-text-main">
          {name}
        </h3>
      )}

      <div className="bg-bg-surface border border-border-color/50 rounded-2xl overflow-hidden card-glow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-color/30">
              <th className="w-10 px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-text-muted/60 italic">
                Set
              </th>
              {hasWeight && <TableHead>Weight</TableHead>}
              {hasReps && <TableHead>Reps</TableHead>}
              {hasDistance && <TableHead>Dist</TableHead>}
              {hasDuration && <TableHead>Time</TableHead>}
            </tr>
          </thead>

          <tbody className="divide-y divide-border-color/10">
            {rows.map((r, i) => (
              <tr
                key={i}
                className="group relative transition-colors duration-200 hover:bg-brand-primary/[0.04]"
              >
                {/* Left accent bar on hover */}
                <td className="w-10 px-5 py-3.5 text-xs font-black text-text-muted/40 tabular-nums">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-full" />
                  {i + 1}
                </td>

                {hasWeight && <TableCell>{fv(r.weight, "kg")}</TableCell>}
                {hasReps && <TableCell>{fv(r.reps)}</TableCell>}
                {hasDistance && (
                  <TableCell>
                    {fv((r.distance / 1000).toFixed(2), "km")}
                  </TableCell>
                )}
                {hasDuration && (
                  <TableCell>
                    {fv(Math.floor(r.duration / 60), "min")}
                  </TableCell>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="py-3.5 pr-5 text-[9px] font-black uppercase tracking-widest text-text-muted/60 italic">
    {children}
  </th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
  <td className="py-3.5 pr-5 text-sm font-black italic text-text-main tabular-nums">
    {children}
  </td>
);
