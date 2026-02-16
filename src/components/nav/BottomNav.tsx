import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Dumbbell,
  ClipboardList,
  BarChart2,
  User,
  Library,
} from "lucide-react";
import { useMemo } from "react";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Library, label: "Library", path: "/library" },
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
      <div className="pointer-events-auto relative w-[90%] max-w-sm bg-[var(--bg-surface)] backdrop-blur-sm border border-[var(--border-color)] rounded-full shadow-md px-3 py-2">
        <div
          className="absolute top-2 left-3 h-10 w-[calc((100%-24px)/5)] bg-[var(--brand-primary)] rounded-full transition-transform duration-300 ease-out"
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
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    isActive ? "text-white" : "text-[var(--text-muted)]"
                  }`}
                >
                  <item.icon size={20} strokeWidth={2} />
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide mt-1 ${
                    isActive
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--text-muted)] opacity-60"
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
