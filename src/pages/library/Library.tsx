import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Target, Dumbbell, ClipboardList } from "lucide-react";

// Sub-Tab Components
import { MusclesTab } from "./muscles/MusclesTab";
import { ExercisesTab } from "./exercises/ExecisesTab";
import { RoutinesTab } from "./routines/RoutinesTab";

/** * PERSISTENCE: State outside the component prevents
 * resetting to "muscles" when navigating back.
 */
let persistedTab: "muscles" | "exercises" | "routines" = "muscles";

export const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(persistedTab);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTabChange = (tab: typeof persistedTab) => {
    persistedTab = tab; // Update the memory
    setActiveTab(tab); // Update the UI
    setSearchQuery("");
  };

  const tabs = [
    { id: "muscles", label: "Muscles", icon: <Target size={14} /> },
    { id: "exercises", label: "Exercises", icon: <Dumbbell size={14} /> },
    { id: "routines", label: "Routines", icon: <ClipboardList size={14} /> },
  ] as const;

  return (
    /* min-h-screen: forces background to stay flush to the bottom.
      pt-[env(safe-area-inset-top)]: skips the notch/dynamic island.
    */
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-h-screen pt-[env(safe-area-inset-top)]">
      {/* TABS HEADER - Sticky stays below notch area */}
      <div className="sticky top-0 z-30 bg-[var(--bg-main)] px-4 pt-6 pb-2">
        <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-[1.8rem] border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.4rem] transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[var(--brand-primary)] text-black shadow-lg"
                  : "text-[var(--text-muted)] active:scale-95"
              }`}
            >
              {tab.icon}
              <span className="text-[11px] font-black uppercase italic tracking-tighter">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: flex-1 allows the "Spring" div inside tabs to push down */}
      <div className="px-4 flex-1 flex flex-col pb-32">
        {/* SEARCH & ADD ACTION LINE */}
        <div className="flex items-center gap-3 mt-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          <button
            onClick={() => navigate(`/library/${activeTab}/add`)}
            className="h-[58px] w-[58px] bg-[var(--brand-primary)] text-black rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 flex-shrink-0"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* LISTS - Wrapped in flex-1 to maintain vertical stretch */}
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "muscles" && <MusclesTab search={searchQuery} />}
          {activeTab === "exercises" && <ExercisesTab search={searchQuery} />}
          {activeTab === "routines" && <RoutinesTab search={searchQuery} />}

          {/* THE SPRING: This pushes the container to fill empty space if the list is short */}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
};
