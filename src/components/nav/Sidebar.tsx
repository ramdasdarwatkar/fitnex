import { useAuth } from "../../context/AuthContext";
import {
  Settings,
  Ruler,
  Trophy,
  LogOut,
  X,
  ChevronRight,
  User,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isStatic?: boolean; // 🆕 Added to handle Web layout
}

export const Sidebar = ({ isOpen, onClose, isStatic = false }: Props) => {
  const { profile, signOut } = useAuth();

  const sidebarClasses = isStatic
    ? "w-full h-full bg-slate-950 border-r border-slate-900" // Web static style
    : `fixed top-0 left-0 bottom-0 w-80 bg-slate-950 z-[70] border-r border-slate-900 transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`; // Mobile drawer style

  return (
    <>
      {/* Backdrop: Only for mobile drawer */}
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
          {/* Close button: Hidden on Web */}
          {!isStatic && (
            <button
              onClick={onClose}
              className="self-end p-2 text-slate-500 mb-4 active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
          )}

          {/* Logo / Brand - Visible on Web */}
          {isStatic && (
            <div className="mb-10 px-4">
              <h2 className="text-xl font-black italic tracking-tighter text-white">
                TRACK<span className="text-brand">FIT</span>
              </h2>
            </div>
          )}

          {/* Athlete Profile Summary */}
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-xl italic">
              {profile?.name?.[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-black text-white text-md truncate w-32">
                {profile?.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Athlete Profile
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            <SidebarLink icon={User} label="My Profile" />
            <SidebarLink icon={Trophy} label="Rank Progress" />
            <SidebarLink icon={Ruler} label="Body Metrics" />
            <SidebarLink icon={Settings} label="Settings" />
          </nav>

          {/* Sign Out */}
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
  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-900 transition-colors group">
    <div className="flex items-center gap-4">
      <Icon
        size={18}
        className="text-slate-500 group-hover:text-brand transition-colors"
      />
      <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight size={14} className="text-slate-800" />
  </button>
);
