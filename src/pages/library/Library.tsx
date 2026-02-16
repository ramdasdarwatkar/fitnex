import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Target, Dumbbell, ClipboardList } from "lucide-react";

// Sub-Tab Components
import { MusclesTab } from "./muscles/MusclesTab";
import { ExercisesTab } from "./exercises/ExecisesTab";
import { RoutinesTab } from "./routines/RoutinesTab";

export const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "muscles" | "exercises" | "routines"
  >("muscles");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "muscles", label: "Muscles", icon: <Target size={14} /> },
    { id: "exercises", label: "Exercises", icon: <Dumbbell size={14} /> },
    { id: "routines", label: "Routines", icon: <ClipboardList size={14} /> },
  ] as const;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)]">
      {/* TABS */}
      <div className="sticky top-0 z-30 bg-[var(--bg-main)] px-4 pt-6 pb-2">
        <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-[1.8rem] border border-[var(--border-color)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.4rem] transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[var(--brand-primary)] text-[var(--bg-main)] shadow-lg"
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

      <div className="px-4 pb-24">
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
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          {/* INLINE ADD BUTTON */}
          <button
            onClick={() => navigate(`/library/${activeTab}/add`)}
            className="h-[58px] w-[58px] bg-[var(--brand-primary)] text-[var(--bg-main)] rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 flex-shrink-0"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* LISTS */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "muscles" && <MusclesTab search={searchQuery} />}
          {activeTab === "exercises" && <ExercisesTab search={searchQuery} />}
          {activeTab === "routines" && <RoutinesTab search={searchQuery} />}
        </div>
      </div>
    </div>
  );
};
