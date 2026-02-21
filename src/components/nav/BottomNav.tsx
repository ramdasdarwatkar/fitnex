import { useState } from "react";
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
} from "lucide-react";
import { useWorkout } from "../../context/WorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { WorkoutService } from "../../services/WorkoutService";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";
import { format } from "date-fns";
import { SiBuymeacoffee } from "react-icons/si";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user_id } = useAuth();
  const { isOngoing, resumeSession } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);

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

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setIsOpen(false);
    setConfirmRecovery(false);

    if (type === "REST") return await WorkoutService.logRestDay(user_id);

    if (type === "PAST") {
      const minDate = format(
        new Date(new Date().setDate(new Date().getDate() - 21)),
        "yyyy-MM-dd",
      );
      return navigate(
        `/workout/active?mode=past&min=${minDate}&max=${format(new Date(), "yyyy-MM-dd")}`,
      );
    }

    await WorkoutService.startNewWorkout(user_id);
    navigate(`/workout/active?mode=live`);
  };

  const handleCenterClick = () => {
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
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
  };

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
          className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
          style={{ zIndex: 9998 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            setConfirmRecovery(false);
          }}
        />
      )}

      {/* NAV WRAPPER */}
      <div
        className="fixed bottom-0 left-0 w-full flex flex-col items-center pointer-events-none"
        style={{
          zIndex: 9999,
        }}
      >
        {/* ACTION MENU */}
        {isOpen && (
          <div className="mb-8 flex gap-8 animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto relative z-[10000]">
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
                icon={SiBuymeacoffee}
                label="Rest"
                onClick={() => handleActionSelect("REST")}
              />
            )}
          </div>
        )}

        <nav className="w-full bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] pointer-events-auto relative z-[10000]">
          <div className="flex items-center h-24 px-4 max-w-2xl mx-auto">
            {/* GROUP 1: HOME & LIBRARY */}
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

            {/* GROUP 2: CENTER ACTION */}
            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCenterClick();
                }}
                className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 active:scale-90 ${
                  isOpen || confirmRecovery
                    ? "bg-white text-black"
                    : "bg-[var(--brand-primary)] text-white shadow-xl"
                }`}
              >
                {isOpen ? (
                  <X size={24} strokeWidth={2.5} className="text-black" />
                ) : confirmRecovery ? (
                  <Play
                    size={24}
                    fill="black"
                    strokeWidth={1.5}
                    className="text-black"
                  />
                ) : isOngoing ? (
                  <Play size={24} fill="currentColor" />
                ) : isRestDay ? (
                  <SiBuymeacoffee size={24} />
                ) : (
                  <Dumbbell size={24} strokeWidth={1.5} />
                )}
              </button>

              <span
                className={`text-[10px] font-black uppercase tracking-tighter text-center max-w-[130px] leading-tight transition-all duration-500 ${
                  confirmRecovery
                    ? "text-red-400"
                    : isOpen
                      ? "text-white"
                      : "text-[var(--brand-primary)]"
                }`}
              >
                {isOngoing
                  ? "Live"
                  : isOpen
                    ? "Close"
                    : confirmRecovery
                      ? "Recovery Day. Train anyway?"
                      : isRestDay
                        ? "Resting"
                        : "Start"}
              </span>
            </div>

            {/* GROUP 3: PROGRESS & PROFILE */}
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

const NavButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  isDisabled,
}: any) => (
  <button
    onClick={(e) => {
      if (isDisabled) return;
      e.stopPropagation();
      onClick();
    }}
    disabled={isDisabled}
    className={`relative flex flex-col items-center justify-center w-20 h-20 transition-all duration-700 ${
      isDisabled
        ? "opacity-10 grayscale pointer-events-none"
        : "opacity-100 cursor-pointer"
    }`}
  >
    <div
      className={`absolute inset-2 rounded-2xl transition-all duration-700 ease-in-out ${
        isActive ? "bg-white/10 opacity-100" : "bg-transparent opacity-0"
      }`}
    />

    <div
      className={`relative z-10 flex flex-col items-center gap-1.5 transition-all duration-500 ${
        isActive ? "text-white" : "text-slate-500 opacity-40"
      }`}
    >
      <Icon size={24} strokeWidth={1.5} />
      <span className="text-[9px] font-black uppercase tracking-[0.1em] leading-none">
        {label}
      </span>
    </div>
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
    <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-[var(--brand-primary)] shadow-2xl active:scale-90 transition-all">
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <span className="text-[10px] font-black text-white uppercase tracking-widest">
      {label}
    </span>
  </button>
);
