import { useAuth } from "../../context/AuthContext";
import {
  Settings,
  Ruler,
  Trophy,
  LogOut,
  X,
  ChevronRight,
  User,
  Library,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isStatic?: boolean;
}

export const Sidebar = ({ isOpen, onClose, isStatic = false }: Props) => {
  const { athlete, signOut } = useAuth();

  const sidebarClasses = isStatic
    ? "w-full h-full bg-[var(--bg-main)] border-r border-[var(--border-color)]"
    : `fixed top-0 left-0 bottom-0 w-80 bg-[var(--bg-main)] z-[70] border-r border-[var(--border-color)] transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`;

  return (
    <>
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
          {!isStatic && (
            <button
              onClick={onClose}
              className="self-end p-2 text-[var(--text-muted)] mb-4 active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
          )}

          {isStatic && (
            <div className="mb-10 px-4">
              <h2 className="text-xl font-black italic tracking-tighter text-[var(--text-main)]">
                TRACK<span className="text-[var(--brand-primary)]">FIT</span>
              </h2>
            </div>
          )}

          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)] bg-opacity-10 border border-[var(--brand-primary)] border-opacity-20 flex items-center justify-center text-[var(--brand-primary)] font-black text-xl italic">
              {athlete?.name?.[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-black text-[var(--text-main)] text-md truncate w-32">
                {athlete?.name}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                Athlete Profile
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarLink icon={User} label="My Profile" />
            <SidebarLink icon={Trophy} label="Rank Progress" />
            <SidebarLink icon={Ruler} label="Body Metrics" />
            <SidebarLink icon={Settings} label="Settings" />
            <SidebarLink icon={Library} label="Library" />
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-3 p-4 w-full rounded-2xl bg-red-500/5 text-red-500 font-bold border border-red-500/10 active:scale-95 transition-all mt-auto"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const SidebarLink = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--bg-surface)] transition-colors group">
    <div className="flex items-center gap-4">
      <Icon
        size={18}
        className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors"
      />
      <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight size={14} className="text-[var(--border-color)]" />
  </button>
);
