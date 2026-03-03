import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, GitCommit, Target, Loader2 } from "lucide-react";
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

interface MusclesTabProps {
  search: string;
}

export const MusclesTab = ({ search }: MusclesTabProps) => {
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Loader2 className="animate-spin text-brand-primary/50" size={30} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-32">
      <div className="space-y-6">
        {filteredData.map((group) => {
          const isMatch =
            !!search && group.name.toLowerCase().includes(search.toLowerCase());
          return (
            <div key={group.id} className="space-y-2.5">
              {/* Primary muscle row */}
              <button
                onClick={() => navigate(`/library/muscles/${group.id}`)}
                className="w-full flex items-center justify-between p-4 bg-bg-surface
                           border border-border-color/40 rounded-2xl group
                           active:scale-[0.97] transition-all card-glow
                           hover:border-brand-primary/30"
              >
                <div className="flex items-center gap-4">
                  {/* Initial badge — highlights when search matches this group */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center
                                font-black italic border transition-colors duration-200
                                ${
                                  isMatch
                                    ? "bg-brand-primary border-transparent"
                                    : "bg-bg-main border-border-color/40 text-brand-primary"
                                }`}
                    style={
                      isMatch
                        ? {
                            color: "var(--color-on-brand)",
                            boxShadow: "0 0 12px var(--glow-primary)",
                          }
                        : undefined
                    }
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-left">
                    <p
                      className="text-[13px] font-black uppercase italic text-text-main
                                  group-hover:text-brand-primary transition-colors
                                  leading-none tracking-tight"
                    >
                      {group.name}
                    </p>
                    <p
                      className="text-[9px] font-black uppercase italic tracking-[0.2em]
                                  text-text-muted/40 mt-1.5"
                    >
                      Primary Group
                      {group.children.length > 0 &&
                        ` · ${group.children.length} sub-muscle${group.children.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-text-muted/30 group-hover:text-brand-primary transition-colors shrink-0"
                />
              </button>

              {/* Sub-muscles */}
              {group.children.length > 0 && (
                <div className="ml-6 space-y-1.5 border-l-2 border-border-color/20 pl-4">
                  {group.children.map((child) => {
                    const childMatch =
                      !!search &&
                      child.name.toLowerCase().includes(search.toLowerCase());
                    return (
                      <button
                        key={child.id}
                        onClick={() => navigate(`/library/muscles/${child.id}`)}
                        className="w-full flex items-center justify-between px-4 py-3
                                   bg-bg-surface/50 border border-border-color/20 rounded-xl
                                   group/child active:scale-[0.98] transition-all
                                   hover:border-border-color/50"
                      >
                        <div className="flex items-center gap-3">
                          <GitCommit
                            size={13}
                            className={`transition-colors shrink-0 ${
                              childMatch
                                ? "text-brand-primary"
                                : "text-text-muted/20"
                            }`}
                          />
                          <p
                            className={`text-[11px] font-black uppercase italic tracking-wider
                                         transition-colors ${
                                           childMatch
                                             ? "text-text-main"
                                             : "text-text-muted/60"
                                         }`}
                          >
                            {child.name}
                          </p>
                        </div>
                        <ChevronRight
                          size={13}
                          className="text-text-muted/20 group-hover/child:text-brand-primary
                                     transition-colors shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted/20">
            <Target size={44} strokeWidth={1} className="mb-4" />
            <p className="text-[10px] font-black uppercase italic tracking-[0.4em]">
              No muscles found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
