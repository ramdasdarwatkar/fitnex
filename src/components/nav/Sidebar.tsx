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

  const sidebarClasses = isStatic
    ? "w-full h-full bg-bg-main"
    : `fixed top-0 left-0 bottom-0 w-85 bg-bg-main z-[70] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? "translate-x-0" : "-translate-x-full"}`;

  return (
    <>
      {!isStatic && (
        <div
          className={`fixed inset-0 bg-bg-main/60 backdrop-blur-md z-[60] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full p-10">
          {!isStatic && (
            <button
              onClick={onClose}
              className="self-end p-3 text-text-muted mb-6 active:scale-90 transition-transform"
            >
              <X size={32} />
            </button>
          )}

          {isStatic && (
            <div className="mb-12 px-4">
              <h2 className="text-2xl font-black italic tracking-tighter text-text-main">
                TRACK<span className="text-brand-primary">FIT</span>
              </h2>
            </div>
          )}

          <div className="flex items-center gap-5 mb-12 px-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-2xl italic">
              {athlete?.name?.[0].toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-text-main text-lg truncate w-40">
                {athlete?.name || "Athlete"}
              </h3>
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.1em]">
                Athlete Profile
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarLink icon={User} label="My Profile" />
            <SidebarLink icon={Trophy} label="Rank Progress" />
            <SidebarLink icon={Ruler} label="Body Metrics" />
            <SidebarLink icon={Settings} label="Settings" />
            <SidebarLink icon={Library} label="Library" />
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-4 p-5 w-full rounded-2xl bg-rose-500/5 text-rose-500 font-black active:scale-95 transition-all mt-auto group hover:bg-rose-500/10"
          >
            <LogOut
              size={22}
              className="transition-transform group-hover:-translate-x-1"
            />
            <span className="text-md uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const SidebarLink = ({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) => (
  <button className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-bg-surface transition-all group btn-scale">
    <div className="flex items-center gap-5">
      <Icon
        size={22}
        strokeWidth={2.5}
        className="text-text-muted group-hover:text-brand-primary transition-colors"
      />
      <span className="text-[15px] font-bold text-text-muted group-hover:text-text-main transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight
      size={18}
      className="text-text-dim group-hover:text-text-main transition-transform group-hover:translate-x-1"
    />
  </button>
);
