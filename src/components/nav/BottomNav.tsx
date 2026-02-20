import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BarChart2,
  User,
  Library,
  Dumbbell,
  Zap,
  History,
  Coffee,
  Play,
  X,
} from "lucide-react";
import { useWorkout } from "../../context/WorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { WorkoutService } from "../../services/WorkoutService";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";
import { format } from "date-fns";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user_id } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();
  const [isOpen, setIsOpen] = useState(false);

  // Check today's rest day status in the active 'workouts' table
  const isRestDay = useLiveQuery(async () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const entry = await db.workouts
      .filter(
        (w) =>
          w.start_time?.includes(todayStr) &&
          (Number(w.rest_day) === 1 || w.rest_day === 1),
      )
      .first();
    return !!entry;
  }, []);

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: BarChart2, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const activeIndex = useMemo(() => {
    const index = navItems.findIndex((n) => n.path === location.pathname);
    if (index === -1) return null;
    return index >= 2 ? index + 1 : index;
  }, [location.pathname, navItems]);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setIsOpen(false);
    if (type === "REST") return await WorkoutService.logRestDay(user_id);

    if (type === "PAST") {
      const now = new Date();
      const minDate = format(
        new Date(now.setDate(now.getDate() - 21)),
        "yyyy-MM-dd",
      );
      return navigate(
        `/workout/active?mode=past&min=${minDate}&max=${format(new Date(), "yyyy-MM-dd")}`,
      );
    }

    await WorkoutService.startNewWorkout(user_id);
    navigate(`/workout/active?mode=live`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center pb-6 z-[101] pointer-events-none">
        {isOpen && (
          <div className="mb-10 flex gap-6 animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto">
            <QuickOption
              icon={Zap}
              label="Live"
              onClick={() => handleActionSelect("LIVE")}
            />
            <QuickOption
              icon={History}
              label="Past"
              onClick={() => handleActionSelect("PAST")}
            />
            <QuickOption
              icon={Coffee}
              label="Rest"
              onClick={() => handleActionSelect("REST")}
            />
          </div>
        )}

        <div className="relative w-[90%] max-w-sm bg-slate-900 border border-white/10 rounded-full shadow-2xl px-2 py-2 pointer-events-auto">
          {activeIndex !== null && !isOpen && (
            <div
              className="absolute top-2 h-12 w-[calc((100%-16px)/5)] bg-white/10 rounded-full transition-transform duration-300 ease-out z-0"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
          )}

          <div className="relative flex items-center justify-between z-10">
            <div className="flex flex-1 justify-around">
              {navItems.slice(0, 2).map((item) => (
                <NavButton
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>

            <div className="relative w-14 h-14 flex items-center justify-center -mt-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOngoing) return resumeSession();
                  if (!isRestDay) setIsOpen(!isOpen);
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-[6px] border-[#020617] z-[110] ${
                  isOpen
                    ? "bg-white text-black"
                    : isOngoing
                      ? "bg-[var(--brand-primary)] text-black animate-pulse"
                      : isRestDay
                        ? "bg-slate-800 text-slate-500 opacity-60"
                        : "bg-[var(--brand-primary)] text-black"
                }`}
              >
                {isOpen ? (
                  <X size={24} strokeWidth={3} />
                ) : isOngoing ? (
                  <Play size={24} fill="currentColor" />
                ) : isRestDay ? (
                  <Coffee size={24} />
                ) : (
                  <Dumbbell size={24} />
                )}
              </button>
            </div>

            <div className="flex flex-1 justify-around">
              {navItems.slice(2).map((item) => (
                <NavButton
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const NavButton = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="flex flex-col items-center justify-center py-1 cursor-pointer"
  >
    <div
      className={`transition-all ${isActive ? "text-white" : "text-slate-500 opacity-40"}`}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
    </div>
    <span
      className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isActive ? "text-white" : "text-slate-500 opacity-40"}`}
    >
      {label}
    </span>
  </button>
);

const QuickOption = ({ icon: Icon, label, onClick }: any) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="flex flex-col items-center gap-2 group cursor-pointer"
  >
    <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-[var(--brand-primary)] shadow-2xl group-active:scale-90 transition-all">
      <Icon size={28} />
    </div>
    <span className="text-[10px] font-black text-white uppercase tracking-widest">
      {label}
    </span>
  </button>
);
