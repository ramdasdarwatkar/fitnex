import { DashboardHeader } from "./components/DashboardHeader";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { CategoryScroller } from "./components/CategoryScroller";
import { Zap } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="px-6 space-y-4 pb-6">
      {/* Greeting & Athlete Profile */}
      <DashboardHeader />

      {/* Weekly Progress */}
      <WeeklyCalendar />

      {/* Workout Categories */}
      <CategoryScroller />

      {/* Recommended Workout */}
      <section className="mt-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Recommended Today
        </h3>

        <div className="group relative w-full h-44 border border-slate-800 rounded-[2.5rem] overflow-hidden transition-all active:scale-[0.98]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-110 transition-transform duration-700" />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-brand tracking-widest">
                Advanced • 45 Min
              </span>

              <h4 className="text-xl font-black uppercase italic leading-none">
                Full Body Power
              </h4>
            </div>

            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
