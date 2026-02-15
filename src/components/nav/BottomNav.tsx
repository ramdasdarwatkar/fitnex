import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, ClipboardList, BarChart2, User } from "lucide-react";
import { useMemo } from "react";

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

  const activeIndex = useMemo(
    () => navItems.findIndex((n) => n.path === location.pathname),
    [location.pathname],
  );

  return (
    <nav className="pointer-events-none w-full h-full flex items-end justify-center pb-2">
      {/* Rounded pill container */}
      <div className="pointer-events-auto relative w-[90%] max-w-sm bg-slate-900/80 backdrop-blur-sm border border-white/5 rounded-full shadow-md px-3 py-2">
        {/* Sliding active tile */}
        <div
          className="absolute top-2 left-3 h-10 w-[calc((100%-24px)/5)] bg-brand rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        <div className="relative flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 active:scale-95 transition"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  <item.icon size={20} strokeWidth={2} />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide mt-1 ${
                    isActive ? "text-brand" : "text-slate-500"
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
