import { Dumbbell, Zap, Timer, Heart, Wind } from "lucide-react";

const CATEGORIES = [
  {
    id: "strength",
    name: "Strength",
    icon: Dumbbell,
    color: "bg-orange-500",
    bg: "from-orange-500/20",
  },
  {
    id: "hiit",
    name: "HIIT",
    icon: Zap,
    color: "bg-yellow-500",
    bg: "from-yellow-500/20",
  },
  {
    id: "cardio",
    name: "Cardio",
    icon: Heart,
    color: "bg-red-500",
    bg: "from-red-500/20",
  },
  {
    id: "endurance",
    name: "Endurance",
    icon: Timer,
    color: "bg-blue-500",
    bg: "from-blue-500/20",
  },
  {
    id: "mobility",
    name: "Mobility",
    icon: Wind,
    color: "bg-emerald-500",
    bg: "from-emerald-500/20",
  },
];

export const CategoryScroller = () => {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex justify-between items-end">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Training Focus
        </h3>
        <button className="text-[10px] font-black uppercase text-brand">
          Explore All
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="flex-shrink-0 group relative w-32 h-40 bg-gradient-to-br to-slate-950 border border-slate-800 rounded-[2rem] overflow-hidden transition-all active:scale-95"
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${cat.bg} to-transparent opacity-40 group-hover:opacity-60 transition-opacity`}
            />

            <div className="relative h-full flex flex-col items-center justify-between py-6">
              <div
                className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center shadow-lg`}
              >
                <cat.icon size={24} className="text-black" />
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-brand transition-colors">
                {cat.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
