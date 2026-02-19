import { useState } from "react";
import {
  Play,
  RotateCcw,
  X,
  CalendarClock,
  Coffee,
  Zap,
  Dumbbell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../../../context/WorkoutContext";
import { useAuth } from "../../../context/AuthContext";
import { WorkoutService } from "../../../services/WorkoutService";

export const WorkoutActionButton = () => {
  const { user_id } = useAuth();
  const navigate = useNavigate();
  const { isOngoing, resumeSession } = useWorkout();
  const [showSetup, setShowSetup] = useState(false);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setShowSetup(false);

    if (type === "REST") return await WorkoutService.logRestDay(user_id);
    if (type === "PAST") return navigate(`/workout/active?mode=past`);

    await WorkoutService.startNewWorkout(user_id);
    navigate(`/workout/active?mode=live`);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => (isOngoing ? resumeSession() : setShowSetup(true))}
        className={`fixed bottom-[100px] right-6 z-[500] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 group ${
          isOngoing
            ? "bg-[var(--brand-primary)] text-black animate-pulse"
            : "bg-white text-black hover:bg-[var(--brand-primary)]"
        }`}
      >
        {isOngoing ? (
          <RotateCcw
            size={28}
            className="group-hover:rotate-[-45deg] transition-transform"
          />
        ) : (
          <Dumbbell size={28} fill="currentColor" className="ml-1" />
        )}

        {isOngoing && (
          <span className="absolute inset-0 rounded-full border-4 border-[var(--brand-primary)] opacity-20 animate-ping" />
        )}
      </button>

      {/* SETUP MODAL WITH BLUR OVERLAY */}
      {showSetup && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          {/* Clickable Backdrop to close */}
          <div
            className="absolute inset-0"
            onClick={() => setShowSetup(false)}
          />

          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] relative z-10">
            <div className="flex justify-between items-center mb-10 px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase italic text-white leading-none tracking-tight">
                  Log Session
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Choose your path
                </p>
              </div>
              <button
                onClick={() => setShowSetup(false)}
                className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid gap-4">
              <SetupOption
                icon={<Zap size={22} fill="currentColor" />}
                title="Live Session"
                sub="Real-time Tracking"
                color="bg-[var(--brand-primary)] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                onClick={() => handleActionSelect("LIVE")}
              />
              <SetupOption
                icon={<CalendarClock size={22} />}
                title="Manual Log"
                sub="Log a past workout"
                color="bg-slate-700 text-white"
                onClick={() => handleActionSelect("PAST")}
              />
              <SetupOption
                icon={<Coffee size={22} />}
                title="Rest Day"
                sub="Recovery & Sleep"
                color="bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                onClick={() => handleActionSelect("REST")}
              />
            </div>

            {/* Bottom safe area spacer */}
            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  );
};

interface SetupOptionProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  color: string;
  onClick: () => void;
}

const SetupOption = ({
  icon,
  title,
  sub,
  color,
  onClick,
}: SetupOptionProps) => (
  <div
    onClick={onClick}
    className="flex items-center gap-6 p-6 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] active:scale-[0.96] transition-all cursor-pointer hover:border-slate-700 group"
  >
    <div
      className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
    >
      {icon}
    </div>
    <div className="text-left">
      <p className="text-sm font-black uppercase italic text-white leading-none">
        {title}
      </p>
      <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 tracking-[0.15em]">
        {sub}
      </p>
    </div>
  </div>
);
