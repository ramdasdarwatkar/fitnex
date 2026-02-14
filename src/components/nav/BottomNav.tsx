import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, ClipboardList, BarChart2, User } from "lucide-react";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Dumbbell, label: "Workouts", path: "/workouts" },
    { icon: ClipboardList, label: "Logs", path: "/logs" },
    { icon: BarChart2, label: "Stats", path: "/stats" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="flex justify-between items-center px-2 h-14 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[1.5rem] shadow-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 transition-all active:scale-95"
              >
                <div
                  className={`relative p-1 transition-all duration-200 ${
                    isActive ? "text-brand scale-110" : "text-slate-500"
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />

                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_#0ea5e9]" />
                  )}
                </div>

                <span
                  className={`text-[7px] font-black uppercase tracking-tighter mt-0.5 ${
                    isActive ? "text-brand" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
