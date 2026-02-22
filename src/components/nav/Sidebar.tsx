import {
  Settings,
  Ruler,
  Trophy,
  LogOut,
  X,
  ChevronRight,
  User,
  Library,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isStatic?: boolean;
}

export const Sidebar = ({ isOpen, onClose, isStatic = false }: Props) => {
  const { athlete, signOut } = useAuth();

  // Using our mapped tokens: bg-bg-main, border-border-color, etc.
  const sidebarClasses = isStatic
    ? "w-full h-full bg-bg-main border-r border-border-color"
    : `fixed top-0 left-0 bottom-0 w-80 bg-bg-main z-[70] border-r border-border-color transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`;

  return (
    <>
      {/* MOBILE OVERLAY */}
      {!isStatic && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full p-8">
          {/* MOBILE CLOSE BUTTON */}
          {!isStatic && (
            <button
              onClick={onClose}
              className="self-end p-2 text-text-muted mb-4 active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
          )}

          {/* LOGO AREA (Only for Desktop Sidebar) */}
          {isStatic && (
            <div className="mb-10 px-4">
              <h2 className="text-xl font-black italic tracking-tighter text-text-main">
                TRACK<span className="text-brand-primary">FIT</span>
              </h2>
            </div>
          )}

          {/* ATHLETE MINI-PROFILE */}
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xl italic">
              {athlete?.name?.[0].toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-text-main text-md truncate w-32">
                {athlete?.name || "Athlete"}
              </h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Athlete Profile
              </p>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex-1 space-y-1">
            <SidebarLink icon={User} label="My Profile" />
            <SidebarLink icon={Trophy} label="Rank Progress" />
            <SidebarLink icon={Ruler} label="Body Metrics" />
            <SidebarLink icon={Settings} label="Settings" />
            <SidebarLink icon={Library} label="Library" />
          </nav>

          {/* SIGN OUT BUTTON */}
          <button
            onClick={signOut}
            className="flex items-center gap-3 p-4 w-full rounded-2xl bg-red-500/5 text-red-500 font-bold border border-red-500/10 active:scale-95 transition-all mt-auto group hover:bg-red-500/10"
          >
            <LogOut
              size={18}
              className="transition-transform group-hover:-translate-x-1"
            />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

/* --- TYPED SUB-COMPONENT --- */
const SidebarLink = ({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) => (
  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-bg-surface-soft transition-all group btn-scale">
    <div className="flex items-center gap-4">
      <Icon
        size={18}
        className="text-text-muted group-hover:text-brand-primary transition-colors"
      />
      <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight
      size={14}
      className="text-border-color group-hover:text-text-main transition-transform group-hover:translate-x-1"
    />
  </button>
);
