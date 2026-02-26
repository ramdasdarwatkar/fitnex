import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import { DateUtils } from "../../util/dateUtils";
import { WorkoutService } from "../../services/WorkoutService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isStatic?: boolean;
}

export const Sidebar = ({ isOpen, onClose, isStatic = false }: Props) => {
  const { athlete, user_id, signOut } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuExpanded, setMenuExpanded] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);

  const nameParts = athlete?.name?.split(" ") || ["Athlete"];

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
    setMenuExpanded(false);
    if (type === "REST") return await WorkoutService.logRestDay(user_id);

    const path =
      type === "PAST"
        ? `/workout/active?mode=past&min=${format(new Date().setDate(new Date().getDate() - 21), "yyyy-MM-dd")}&max=${format(new Date(), "yyyy-MM-dd")}`
        : `/workout/active?mode=live`;

    if (type !== "PAST") await WorkoutService.startNewWorkout(user_id);
    navigate(path);
    if (!isStatic) onClose();
  };

  const handleCenterClick = useCallback(() => {
    if (isOngoing) return resumeSession();
    if (isRestDay && !confirmRecovery && !menuExpanded)
      return setConfirmRecovery(true);
    setMenuExpanded(!menuExpanded);
    setConfirmRecovery(false);
  }, [isOngoing, isRestDay, confirmRecovery, menuExpanded, resumeSession]);

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: BarChart2, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const sidebarBase =
    "h-full bg-bg-surface flex flex-col border-r border-border-color/40 overflow-hidden";
  const responsiveClasses = isStatic
    ? `w-72 sticky top-0 ${sidebarBase}`
    : `fixed inset-y-0 left-0 w-80 z-[100] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${sidebarBase}`;

  return (
    <>
      <AnimatePresence>
        {!isStatic && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm z-90"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={responsiveClasses}>
        {/* LOGO SECTION */}
        <div className="pt-10 px-8 pb-8 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold tracking-widest text-text-main uppercase">
            Fit<span className="text-brand-primary">nex</span>
          </h2>
          {!isStatic && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-bg-main text-text-muted active:scale-90 transition-all border border-border-color/40"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* PROFILE SECTION: Uses bg-bg-main/40 for a recessed card feel */}
        <div className="px-6 mb-8 shrink-0">
          <div className="p-4 bg-bg-main/40 border border-border-color/60 rounded-xl">
            <div className="flex items-center gap-4">
              {/* Avatar uses bg-main text for contrast on Emerald */}
              <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center text-bg-main font-bold text-lg shadow-sm">
                {athlete?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider mb-1 block w-fit">
                  Level {athlete?.current_level || 1}
                </span>
                <h3 className="font-bold text-text-main text-sm uppercase truncate">
                  {nameParts[0]} {nameParts[1] || ""}
                </h3>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4 h-1.5 w-full bg-border-color/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${athlete?.level_completion_percent || 0}%`,
                }}
                className="h-full bg-brand-primary rounded-full"
              />
            </div>
          </div>
        </div>

        {/* NAV SECTION */}
        <nav className="flex-1 px-4 overflow-y-auto samsung-scroll flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (!isStatic) onClose();
                }}
                className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-bg-main border border-border-color/40"
                    : "hover:bg-bg-main/40"
                }`}
              >
                <item.icon
                  size={20}
                  className={
                    isActive ? "text-brand-primary" : "text-text-muted"
                  }
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-sm font-bold uppercase tracking-wide ${
                    isActive ? "text-text-main" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* LAUNCHER BUTTON */}
          <div className="mt-6 px-1">
            <button
              onClick={handleCenterClick}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border border-border-color/40 shadow-sm
                ${
                  menuExpanded || confirmRecovery
                    ? "bg-text-main text-bg-main"
                    : "bg-brand-primary text-bg-main"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {isOngoing ? (
                  <Play size={18} fill="currentColor" />
                ) : isRestDay ? (
                  <CupSoda size={18} />
                ) : (
                  <Dumbbell size={18} />
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isOngoing
                    ? "Resume Session"
                    : confirmRecovery
                      ? "Train Now?"
                      : isRestDay
                        ? "Rest Day"
                        : "Start Workout"}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${menuExpanded ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {menuExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-bg-main/20 rounded-b-xl border-x border-b border-border-color/40"
                >
                  <SidebarQuickOption
                    icon={Zap}
                    label="Live Workout"
                    onClick={() => handleActionSelect("LIVE")}
                  />
                  <SidebarQuickOption
                    icon={History}
                    label="Past Entry"
                    onClick={() => handleActionSelect("PAST")}
                  />
                  {!isRestDay && (
                    <SidebarQuickOption
                      icon={HatGlasses}
                      label="Log Rest"
                      onClick={() => handleActionSelect("REST")}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* TERMINATE ACTION */}
        <div className="p-6 shrink-0 border-t border-border-color/40">
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-brand-error/10 text-brand-error border border-brand-error/20 hover:bg-brand-error hover:text-bg-main transition-all active:scale-95 group"
          >
            <LogOut
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Terminate
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

const SidebarQuickOption = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 px-6 text-text-muted hover:text-text-main hover:bg-bg-main transition-all group"
  >
    <Icon
      size={14}
      className="text-brand-primary/60 group-hover:text-brand-primary transition-colors"
    />
    <span className="text-[10px] font-bold uppercase tracking-widest">
      {label}
    </span>
  </button>
);
