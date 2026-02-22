import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BarChart2,
  User,
  Library,
  Play,
  Zap,
  History,
  X,
  Dumbbell,
  HatGlasses,
  CupSoda,
  type LucideIcon,
} from "lucide-react";
import { WorkoutService } from "../../services/WorkoutService";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";
import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user_id } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);

  // OPTIMIZED: Indexed query for Rest Day status
  const isRestDay = useLiveQuery(async () => {
    const today = new Date();
    const entry = await db.workouts
      .where("start_time")
      .between(startOfDay(today).toISOString(), endOfDay(today).toISOString())
      .filter((w) => Number(w.rest_day) === 1)
      .first();
    return !!entry;
  }, []);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setIsOpen(false);
    setConfirmRecovery(false);

    if (type === "REST") return await WorkoutService.logRestDay(user_id);

    if (type === "PAST") {
      const minDate = format(
        new Date().setDate(new Date().getDate() - 21),
        "yyyy-MM-dd",
      );
      return navigate(
        `/workout/active?mode=past&min=${minDate}&max=${format(new Date(), "yyyy-MM-dd")}`,
      );
    }

    await WorkoutService.startNewWorkout(user_id);
    navigate(`/workout/active?mode=live`);
  };

  const handleCenterClick = useCallback(() => {
    if (isOngoing) return resumeSession();
    if (isRestDay && !confirmRecovery && !isOpen) {
      setConfirmRecovery(true);
      return;
    }
    if (confirmRecovery && !isOpen) {
      setIsOpen(true);
      setConfirmRecovery(false);
      return;
    }
    setIsOpen(!isOpen);
  }, [isOngoing, isRestDay, confirmRecovery, isOpen, resumeSession]);

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: BarChart2, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      {/* SHIELD BACKDROP */}
      {(isOpen || confirmRecovery) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto z-9998"
          onClick={() => {
            setIsOpen(false);
            setConfirmRecovery(false);
          }}
        />
      )}

      {/* NAV WRAPPER */}
      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center pointer-events-none z-9999">
        {/* ACTION MENU (Floating Above Nav) */}
        {isOpen && (
          <div className="mb-8 flex gap-8 animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto">
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
            {!isRestDay && (
              <QuickOption
                icon={HatGlasses}
                label="Rest"
                onClick={() => handleActionSelect("REST")}
              />
            )}
          </div>
        )}

        <nav className="w-full bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 shadow-2xl pointer-events-auto">
          <div className="flex items-center h-24 px-4 max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-1 justify-evenly items-center">
              {navItems.slice(0, 2).map((item) => (
                <NavButton
                  key={item.path}
                  {...item}
                  isActive={location.pathname === item.path}
                  isDisabled={isOpen || confirmRecovery}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>

            {/* CENTER ACTION BUTTON */}
            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <button
                onClick={handleCenterClick}
                className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 active:scale-90 btn-scale ${
                  isOpen || confirmRecovery
                    ? "bg-white text-black"
                    : "bg-brand-primary text-white shadow-xl shadow-brand-primary/20"
                }`}
              >
                {isOpen ? (
                  <X size={24} strokeWidth={2.5} />
                ) : confirmRecovery ? (
                  <Play size={24} fill="black" />
                ) : isOngoing ? (
                  <Play size={24} fill="currentColor" />
                ) : isRestDay ? (
                  <CupSoda size={24} />
                ) : (
                  <Dumbbell size={24} strokeWidth={1.5} />
                )}
              </button>

              <span
                className={`text-[10px] font-black uppercase tracking-tighter text-center transition-all duration-500 ${
                  confirmRecovery
                    ? "text-red-400"
                    : isOpen
                      ? "text-white"
                      : "text-brand-primary"
                }`}
              >
                {isOngoing
                  ? "Live"
                  : isOpen
                    ? "Close"
                    : confirmRecovery
                      ? "Recovery Day. Train?"
                      : isRestDay
                        ? "Resting"
                        : "Start"}
              </span>
            </div>

            <div className="flex flex-1 justify-evenly items-center">
              {navItems.slice(2).map((item) => (
                <NavButton
                  key={item.path}
                  {...item}
                  isActive={location.pathname === item.path}
                  isDisabled={isOpen || confirmRecovery}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

/* --- SUB-COMPONENTS (Typed) --- */

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isDisabled: boolean;
}

const NavButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  isDisabled,
}: NavButtonProps) => (
  <button
    onClick={(e) => {
      if (isDisabled) return;
      e.stopPropagation();
      onClick();
    }}
    disabled={isDisabled}
    className={`relative flex flex-col items-center justify-center w-16 h-16 transition-all duration-700 ${
      isDisabled ? "opacity-10 grayscale pointer-events-none" : "opacity-100"
    }`}
  >
    <div
      className={`absolute inset-0 rounded-2xl transition-all duration-700 ${isActive ? "bg-white/10" : "bg-transparent"}`}
    />
    <div
      className={`relative z-10 flex flex-col items-center gap-1.5 transition-all duration-500 ${isActive ? "text-white" : "text-slate-500 opacity-40"}`}
    >
      <Icon size={22} strokeWidth={1.5} />
      <span className="text-[8px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  </button>
);

const QuickOption = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-2xl active:scale-90 transition-all btn-scale">
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <span className="text-[10px] font-black text-white uppercase tracking-widest">
      {label}
    </span>
  </button>
);
