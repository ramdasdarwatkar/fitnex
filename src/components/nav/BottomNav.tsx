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
    <nav className="fixed bottom-0 left-0 right-0 z-[100]">
      {/* Solid color background (#0b1221)
        Height 72px (h-[72px]) ensures icons sit above the home indicator.
        No pb-safe or safe-area padding here.
      */}
      <div className="bg-[#0b1221] border-t border-white/5 h-[72px] w-full">
        <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 h-full pt-1 transition-all active:scale-95"
              >
                <div className={isActive ? "text-[#ff7f50]" : "text-slate-500"}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                <span
                  className={`text-[9px] font-bold uppercase mt-1 ${
                    isActive ? "text-[#ff7f50]" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <div className="w-1 h-1 bg-[#ff7f50] rounded-full mt-1 shadow-[0_0_8px_#ff7f50]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
