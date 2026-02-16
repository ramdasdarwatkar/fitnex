import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, GitCommit, Target } from "lucide-react";
import { LibraryService } from "../../../services/LibraryService";

// Types
import type { Database } from "../../../types/database.types";
type Muscle = Database["public"]["Tables"]["muscles"]["Row"];

interface MusclesTabProps {
  search: string;
}

export const MusclesTab = ({ search }: MusclesTabProps) => {
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load Data via Service
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await LibraryService.getActiveMuscles();
        // Sorting alphabetically for a pro feel
        setMuscles(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to load muscles:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const query = search.toLowerCase().trim();

  // 2. Hierarchy Helpers
  const getSubMuscles = (parentId: string) =>
    muscles.filter((m) => m.parent === parentId);

  // 3. Deep Filter Logic
  const filteredPrimary = muscles.filter((m) => {
    if (m.parent) return false;

    const parentMatches = m.name.toLowerCase().includes(query);
    const subMuscles = getSubMuscles(m.id);
    const anyChildMatches = subMuscles.some((c) =>
      c.name.toLowerCase().includes(query),
    );

    return parentMatches || anyChildMatches;
  });

  if (loading) return null;

  return (
    /* flex-1 ensures the background color is forced to the bottom */
    <div className="flex-1 flex flex-col gap-6">
      <div className="space-y-6">
        {filteredPrimary.map((muscle) => {
          const children = getSubMuscles(muscle.id).filter(
            (c) =>
              query === "" ||
              c.name.toLowerCase().includes(query) ||
              muscle.name.toLowerCase().includes(query),
          );

          return (
            <div
              key={muscle.id}
              className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {/* Primary Muscle Card */}
              <button
                onClick={() => navigate(`/library/muscles/${muscle.id}`)}
                className="w-full flex items-center justify-between p-5 bg-[var(--bg-surface)] border border-slate-800 rounded-[1.5rem] group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border transition-all ${
                      muscle.name.toLowerCase().includes(query) && query !== ""
                        ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-black"
                        : "bg-[var(--bg-main)] border-slate-800 text-[var(--brand-primary)]"
                    }`}
                  >
                    {muscle.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase italic text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors leading-none">
                      {muscle.name}
                    </p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      Primary Group
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-600 group-hover:text-[var(--brand-primary)] transition-colors"
                />
              </button>

              {/* Sub-Muscles List */}
              {children.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-slate-800 pl-4">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => navigate(`/library/muscles/${child.id}`)}
                      className="w-full flex items-center justify-between p-3.5 bg-[var(--bg-surface)] bg-opacity-40 border border-slate-800 rounded-xl group active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <GitCommit
                          size={14}
                          className={
                            child.name.toLowerCase().includes(query) &&
                            query !== ""
                              ? "text-[var(--brand-primary)]"
                              : "text-slate-600"
                          }
                        />
                        <p
                          className={`text-[12px] font-bold uppercase italic transition-colors ${
                            child.name.toLowerCase().includes(query) &&
                            query !== ""
                              ? "text-[var(--text-main)]"
                              : "text-slate-500"
                          }`}
                        >
                          {child.name}
                        </p>
                      </div>
                      <ChevronRight
                        size={12}
                        className="text-slate-600 group-hover:text-[var(--brand-primary)]"
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
          <div className="flex flex-col items-center justify-center py-24 opacity-20">
            <Target size={48} strokeWidth={1} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">
              No Muscles Found
            </p>
          </div>
        )}
      </div>

      {/* THE SPRING: Pushes everything up but stays flush to the bottom */}
      <div className="flex-1" />
    </div>
  );
};
