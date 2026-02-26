import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, GitCommit, Target, Loader2 } from "lucide-react";

// Types
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

interface MusclesTabProps {
  search: string;
}

export const MusclesTab = ({ search }: MusclesTabProps) => {
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load Data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await MuscleService.getActiveMuscles();
        if (isMounted) {
          setMuscles([...data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error: unknown) {
        console.error("Failed to load muscles:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Hierarchy & Search Logic
  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    const primary = muscles.filter((m) => !m.parent);

    return primary
      .map((parent) => {
        const children = muscles.filter((m) => m.parent === parent.id);
        const parentMatches = parent.name.toLowerCase().includes(query);
        const matchingChildren = children.filter(
          (c) => c.name.toLowerCase().includes(query) || parentMatches,
        );

        return {
          ...parent,
          children: matchingChildren,
          isVisible: parentMatches || matchingChildren.length > 0,
        };
      })
      .filter((group) => group.isVisible);
  }, [muscles, search]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-6">
        {filteredData.map((group) => (
          <div key={group.id} className="space-y-3">
            {/* Primary Muscle Card */}
            <button
              onClick={() => navigate(`/library/muscles/${group.id}`)}
              className="w-full flex items-center justify-between p-4 bg-bg-surface border border-border-color rounded-xl group active:scale-[0.98] transition-all shadow-sm hover:border-brand-primary/30"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border transition-all ${
                    search &&
                    group.name.toLowerCase().includes(search.toLowerCase())
                      ? "bg-brand-primary border-brand-primary text-bg-main"
                      : "bg-bg-main border-border-color text-brand-primary"
                  }`}
                >
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-black uppercase italic text-text-main group-hover:text-brand-primary transition-colors leading-none tracking-tight">
                    {group.name}
                  </p>
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-text-muted mt-2 opacity-60">
                    Primary Group
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-text-muted group-hover:text-brand-primary transition-colors"
              />
            </button>

            {/* Sub-Muscles List */}
            {group.children.length > 0 && (
              <div className="ml-6 space-y-2 border-l-2 border-border-color pl-4">
                {group.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => navigate(`/library/muscles/${child.id}`)}
                    className="w-full flex items-center justify-between p-3.5 bg-bg-surface/50 border border-border-color/60 rounded-xl group active:scale-[0.98] transition-all hover:border-border-color"
                  >
                    <div className="flex items-center gap-3">
                      <GitCommit
                        size={14}
                        className={
                          search &&
                          child.name
                            .toLowerCase()
                            .includes(search.toLowerCase())
                            ? "text-brand-primary"
                            : "text-text-muted/40"
                        }
                      />
                      <p
                        className={`text-[11px] font-black uppercase italic tracking-wide transition-colors ${
                          search &&
                          child.name
                            .toLowerCase()
                            .includes(search.toLowerCase())
                            ? "text-text-main"
                            : "text-text-muted"
                        }`}
                      >
                        {child.name}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-text-muted/30 group-hover:text-brand-primary transition-colors"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-30">
            <Target
              size={40}
              strokeWidth={2}
              className="mb-4 text-text-muted"
            />
            <p className="text-[10px] font-black uppercase italic tracking-[0.3em] text-text-muted">
              No Muscles Found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
