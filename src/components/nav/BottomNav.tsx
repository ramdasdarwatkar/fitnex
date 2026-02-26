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
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import { DateUtils } from "../../util/dateUtils";

// --- TYPES ---

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface NavButtonProps extends NavItem {
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

interface QuickOptionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user_id } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);

  const isRestDay = useLiveQuery(async () => {
    if (!user_id) return false;
    const [start, end] = DateUtils.getTodayWindow();
    const entry = await db.workouts
      .where("start_time")
      .between(start, end, true, true)
      .filter((w) => w.user_id === user_id && Number(w.rest_day) === 1)
      .first();
    return !!entry;
  }, [user_id]);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setIsOpen(false);
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
    if (isRestDay && !confirmRecovery && !isOpen)
      return setConfirmRecovery(true);
    if (confirmRecovery && !isOpen) {
      setIsOpen(true);
      setConfirmRecovery(false);
      return;
    }
    setIsOpen(!isOpen);
  }, [isOngoing, isRestDay, confirmRecovery, isOpen, resumeSession]);

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: BarChart2, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      {/* Dynamic Backdrop */}
      {(isOpen || confirmRecovery) && (
        <div
          className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm z-9998 animate-in fade-in duration-300"
          onClick={() => {
            setIsOpen(false);
            setConfirmRecovery(false);
          }}
        />
      )}

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center z-9999 pointer-events-none px-4 pb-8">
        {/* Floating Quick Action Menu */}
        {isOpen && (
          <div className="mb-6 flex gap-4 p-4 bg-bg-surface/90 backdrop-blur-xl rounded-xl border border-border-color/40 shadow-xl pointer-events-auto animate-in slide-in-from-bottom-4">
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

        {/* Main Nav Bar Pill */}
        <nav className="w-full max-w-lg bg-bg-surface/90 backdrop-blur-xl rounded-4xl border border-border-color/40 pointer-events-auto nav-shadow-light dark:nav-shadow-dark transition-all duration-500">
          <div className="flex items-center justify-between h-20 px-6 relative">
            {/* Left Nav Slots */}
            <div className="flex flex-1 justify-around">
              <NavButton
                {...navItems[0]}
                isActive={location.pathname === navItems[0].path}
                isDisabled={isOpen}
                onClick={() => navigate(navItems[0].path)}
              />
              <NavButton
                {...navItems[1]}
                isActive={location.pathname === navItems[1].path}
                isDisabled={isOpen}
                onClick={() => navigate(navItems[1].path)}
              />
            </div>

            {/* Central Signature Launcher */}
            <div className="relative -top-2 flex flex-col items-center">
              <button
                onClick={handleCenterClick}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl active:scale-90
                  ${
                    isOpen || confirmRecovery
                      ? "bg-text-main text-bg-main"
                      : "bg-brand-primary text-bg-main"
                  }
                `}
              >
                {isOpen ? (
                  <X size={24} strokeWidth={2.5} />
                ) : confirmRecovery || isOngoing ? (
                  <Play size={24} fill="currentColor" />
                ) : isRestDay ? (
                  <CupSoda size={24} />
                ) : (
                  <Dumbbell size={24} />
                )}
              </button>

              {/* Fitnex Signature Typography */}
              <span
                className={`absolute -bottom-5 text-[10px] font-black uppercase italic tracking-tighter transition-all
                ${confirmRecovery ? "text-brand-primary animate-pulse" : "text-text-muted"}`}
              >
                {isOngoing
                  ? "Live"
                  : isOpen
                    ? "Close"
                    : confirmRecovery
                      ? "Train?"
                      : isRestDay
                        ? "Rest"
                        : "Start"}
              </span>
            </div>

            {/* Right Nav Slots */}
            <div className="flex flex-1 justify-around">
              <NavButton
                {...navItems[2]}
                isActive={location.pathname === navItems[2].path}
                isDisabled={isOpen}
                onClick={() => navigate(navItems[2].path)}
              />
              <NavButton
                {...navItems[3]}
                isActive={location.pathname === navItems[3].path}
                isDisabled={isOpen}
                onClick={() => navigate(navItems[3].path)}
              />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

// --- SUB-COMPONENTS ---

const NavButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  isDisabled,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 ${
      isDisabled ? "opacity-20 grayscale" : "opacity-100"
    }`}
  >
    <Icon
      size={22}
      className={isActive ? "text-brand-primary" : "text-text-muted"}
      strokeWidth={isActive ? 2.5 : 2}
    />
    <span
      className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? "text-brand-primary" : "text-text-muted"}`}
    >
      {label}
    </span>
  </button>
);

const QuickOption = ({ icon: Icon, label, onClick }: QuickOptionProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 px-3 py-1 group transition-all active:scale-95"
  >
    <div className="w-12 h-12 rounded-xl bg-bg-main border border-border-color/40 flex items-center justify-center text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary/10">
      <Icon size={22} />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wide text-text-main">
      {label}
    </span>
  </button>
);
