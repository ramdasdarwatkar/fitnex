import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Target, Dumbbell, ClipboardList } from "lucide-react";

import { MusclesTab } from "./muscles/MusclesTab";
import { ExercisesTab } from "./exercises/ExecisesTab";
import { RoutinesTab } from "./routines/RoutinesTab";

// Module-level tab state persists across mounts without a context
const LibraryState = {
  activeTab: "muscles" as "muscles" | "exercises" | "routines",
  setTab(tab: "muscles" | "exercises" | "routines") {
    this.activeTab = tab;
  },
};

type TabId = "muscles" | "exercises" | "routines";

export const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>(LibraryState.activeTab);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTabChange = (tab: TabId) => {
    LibraryState.setTab(tab);
    setActiveTab(tab);
    setSearchQuery("");
  };

  const tabs = useMemo(
    () => [
      { id: "muscles" as const, label: "Muscles", icon: <Target size={14} /> },
      {
        id: "exercises" as const,
        label: "Exercises",
        icon: <Dumbbell size={14} />,
      },
      {
        id: "routines" as const,
        label: "Routines",
        icon: <ClipboardList size={14} />,
      },
    ],
    [],
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-main">
      {/* ── STICKY NAV ── */}
      <div className="sticky top-0 z-40 bg-bg-main/95 backdrop-blur-md pb-4 border-b border-border-color/20">
        {/* Segmented tab bar */}
        <div className="flex bg-bg-surface p-1.5 rounded-2xl border border-border-color/40 card-glow mb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                            transition-all duration-300 active:scale-[0.97]
                            ${
                              isActive
                                ? "bg-brand-primary"
                                : "text-text-muted/40 hover:text-text-main"
                            }`}
                style={
                  isActive
                    ? {
                        color: "var(--color-on-brand)",
                        boxShadow: "0 2px 12px var(--glow-primary)",
                      }
                    : undefined
                }
              >
                <div className={isActive ? "animate-pulse" : ""}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-black uppercase italic tracking-widest">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + add */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40
                            group-focus-within:text-brand-primary transition-colors pointer-events-none"
            >
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-color/40 rounded-2xl
                         py-3.5 pl-11 pr-4 text-[13px] font-black italic text-text-main
                         outline-none focus:border-brand-primary/40 transition-colors
                         placeholder:text-text-muted/20"
            />
          </div>

          <button
            onClick={() => navigate(`/library/${activeTab}/add`)}
            className="h-12 w-12 bg-brand-primary rounded-2xl flex items-center justify-center
                       active:scale-90 transition-all shrink-0"
            style={{
              color: "var(--color-on-brand)",
              boxShadow: "0 2px 12px var(--glow-primary)",
            }}
          >
            <Plus size={24} strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col pt-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "muscles" && <MusclesTab search={searchQuery} />}
        {activeTab === "exercises" && <ExercisesTab search={searchQuery} />}
        {activeTab === "routines" && <RoutinesTab search={searchQuery} />}
        <div className="flex-1" />
      </div>
    </div>
  );
};
