import { useEffect, useState } from "react";
import { db } from "../../../db/database";
import { ChevronRight, GitCommit, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "../../../types/database.types";

type Muscle = Database["public"]["Tables"]["muscles"]["Row"];

export const MusclesTab = ({ search }: { search: string }) => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // Only load active muscles
      const data = await db.muscles.filter((m) => m.status !== false).toArray();
      setMuscles(data);
    };
    load();
  }, []);

  const query = search.toLowerCase().trim();

  // 1. Grouping Logic
  const getSubMuscles = (parentId: string) =>
    muscles.filter((m) => m.parent === parentId);

  // 2. Filter Logic: Only show primary muscles that match OR have matching children
  const filteredPrimary = muscles.filter((m) => {
    if (m.parent) return false; // Skip children in the top-level map

    const parentMatches = m.name.toLowerCase().includes(query);
    const subMuscles = getSubMuscles(m.id);
    const anyChildMatches = subMuscles.some((c) =>
      c.name.toLowerCase().includes(query),
    );

    return parentMatches || anyChildMatches;
  });

  return (
    <div className="space-y-6">
      {filteredPrimary.map((muscle) => {
        // Filter children based on search: show all if parent matches, or just the matching children
        const children = getSubMuscles(muscle.id).filter(
          (c) =>
            query === "" ||
            c.name.toLowerCase().includes(query) ||
            muscle.name.toLowerCase().includes(query),
        );

        return (
          <div
            key={muscle.id}
            className="space-y-2 animate-in fade-in duration-300"
          >
            {/* Primary Muscle Card */}
            <button
              onClick={() => navigate(`/library/muscles/${muscle.id}`)}
              className="w-full flex items-center justify-between p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[1.5rem] group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border transition-all ${
                    muscle.name.toLowerCase().includes(query) && query !== ""
                      ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--bg-main)]"
                      : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--brand-primary)]"
                  }`}
                >
                  {muscle.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase italic text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">
                    {muscle.name}
                  </p>
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Primary Group
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </button>

            {/* Sub-Muscles List */}
            {children.length > 0 && (
              <div className="ml-6 space-y-2 border-l-2 border-[var(--border-color)] pl-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => navigate(`/library/muscles/${child.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-[var(--bg-surface)] bg-opacity-50 border border-[var(--border-color)] rounded-xl group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <GitCommit
                        size={14}
                        className={
                          child.name.toLowerCase().includes(query) &&
                          query !== ""
                            ? "text-[var(--brand-primary)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
                      <p
                        className={`text-[12px] font-bold uppercase italic transition-colors ${
                          child.name.toLowerCase().includes(query) &&
                          query !== ""
                            ? "text-[var(--text-main)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {child.name}
                      </p>
                    </div>
                    <ChevronRight
                      size={12}
                      className="text-[var(--text-muted)]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {filteredPrimary.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Target size={48} strokeWidth={1} className="mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            No Muscles Found
          </p>
        </div>
      )}
    </div>
  );
};
