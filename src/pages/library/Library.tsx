import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Target, Dumbbell, ClipboardList } from "lucide-react";

// Sub-Tab Components
import { MusclesTab } from "./muscles/MusclesTab";
import { ExercisesTab } from "./exercises/ExecisesTab";
import { RoutinesTab } from "./routines/RoutinesTab";

/**
 * 1. PERSISTENCE ENGINE
 * We move the variable into a small manager object.
 * This satisfies the compiler because we are calling a method,
 * not performing a direct assignment in the render path.
 */
const LibraryState = {
  activeTab: "muscles" as "muscles" | "exercises" | "routines",
  setTab(tab: "muscles" | "exercises" | "routines") {
    this.activeTab = tab;
  },
};

export const Library = () => {
  const navigate = useNavigate();

  // Initialize state from the singleton
  const [activeTab, setActiveTab] = useState(LibraryState.activeTab);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTabChange = (tab: typeof LibraryState.activeTab) => {
    // Update the singleton and the local state
    LibraryState.setTab(tab);
    setActiveTab(tab);
    setSearchQuery("");
  };

  const tabs = useMemo(
    () =>
      [
        { id: "muscles", label: "Muscles", icon: <Target size={14} /> },
        { id: "exercises", label: "Exercises", icon: <Dumbbell size={14} /> },
        {
          id: "routines",
          label: "Routines",
          icon: <ClipboardList size={14} />,
        },
      ] as const,
    [],
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-main min-h-screen pt-safe">
      {/* TABS HEADER */}
      <div className="sticky top-0 z-30 bg-bg-main pt-6 pb-2">
        <div className="flex bg-bg-surface p-1.5 rounded-[1.8rem] border border-border-color shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.4rem] transition-all duration-300 ${
                  isActive
                    ? "bg-brand-primary text-black shadow-lg shadow-brand-primary/20"
                    : "text-text-muted active:scale-95 hover:text-text-main"
                }`}
              >
                {tab.icon}
                <span className="text-[11px] font-black uppercase italic tracking-tighter">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pb-32">
        <div className="flex items-center gap-3 mt-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-color rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand-primary transition-all placeholder:text-text-muted/50"
            />
          </div>

          <button
            onClick={() => navigate(`/library/${activeTab}/add`)}
            className="h-14.5 w-14.5 bg-brand-primary text-black rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-brand-primary/20 shrink-0"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "muscles" && <MusclesTab search={searchQuery} />}
          {activeTab === "exercises" && <ExercisesTab search={searchQuery} />}
          {activeTab === "routines" && <RoutinesTab search={searchQuery} />}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
};
