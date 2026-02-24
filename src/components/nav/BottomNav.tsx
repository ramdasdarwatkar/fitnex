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

// --- COMPONENT ---

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
        `/workout/active?mode=past&min=${minDate}&max=${format(
          new Date(),
          "yyyy-MM-dd",
        )}`,
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
      {/* Overlay Backdrop */}
      {(isOpen || confirmRecovery) && (
        <div
          className="fixed inset-0 bg-bg-main/60 backdrop-blur-sm z-9998 animate-in fade-in duration-300"
          onClick={() => {
            setIsOpen(false);
            setConfirmRecovery(false);
          }}
        />
      )}

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center z-9999 pointer-events-none px-4 pb-6">
        {/* Quick Action Floating Menu */}
        {isOpen && (
          <div className="mb-6 flex gap-4 p-4 bg-bg-surface/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl pointer-events-auto">
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

        {/* Main Navigation Container */}
        <nav className="w-full max-w-lg bg-bg-surface/80 backdrop-blur-3xl rounded-[2.5rem] glow-heavy pointer-events-auto">
          {/* EQUAL SPACING LOGIC: 
              Using a single flex row with justify-between and consistent padding
          */}
          <div className="flex items-center justify-between h-20 px-6 relative">
            {/* Left Items */}
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

            {/* Central Action Trigger */}
            <div className="relative -top-2 flex flex-col items-center">
              <button
                onClick={handleCenterClick}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl btn-scale ${
                  isOpen || confirmRecovery
                    ? "bg-text-main text-bg-main"
                    : "bg-brand-primary text-bg-main"
                }`}
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
              <span
                className={`absolute -bottom-5 text-[10px] font-bold tracking-tight transition-all ${
                  confirmRecovery
                    ? "text-brand-primary animate-pulse"
                    : "text-text-muted"
                }`}
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

            {/* Right Items */}
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
    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-300 ${
      isDisabled ? "opacity-20 blur-[0.5px]" : "opacity-100"
    }`}
  >
    <Icon
      size={22}
      className={isActive ? "text-brand-primary" : "text-text-muted"}
      strokeWidth={isActive ? 3 : 2}
    />
    <span
      className={`text-[9px] font-semibold ${
        isActive ? "text-brand-primary" : "text-text-muted"
      }`}
    >
      {label}
    </span>
  </button>
);

const QuickOption = ({ icon: Icon, label, onClick }: QuickOptionProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 px-4 py-2 rounded-2xl group transition-colors"
  >
    <div className="w-12 h-12 rounded-2xl bg-bg-surface-soft flex items-center justify-center text-brand-primary shadow-sm group-active:scale-90 transition-transform">
      <Icon size={24} />
    </div>
    <span className="text-[11px] font-bold text-text-main">{label}</span>
  </button>
);
